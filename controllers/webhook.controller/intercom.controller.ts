// require('dotenv').config();
import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { Feedback, IntercomWebhook, Organization } from '../../database';
import config from '../../config';
import axios from 'axios';
import { decrypt } from '../../utils/func';
const algoliasearch = require('algoliasearch');

const get: RequestHandler = async (req: Request, res: Response, next) => {
  const APIToken = config.INTERCOM_API_AUTHENTICATION_TOKEN;
  const feedbackGPTAPI = config.FEEDBACK_GPT_WEAVIATE_API;
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
  const index = algoliaClient.initIndex(config.ALGOLIA_INDEX_NAME);

  const payload = req.body;
  await IntercomWebhook.create(payload);

  const query = new URLSearchParams({ display_as: 'plaintext' }).toString();

  const organizationId = req.params.id;

  console.log('organizationId', organizationId);

  console.log('[payload ===> in IntercomWebhook ]', JSON.stringify(payload));

  const { data } = payload || { data: null };

  const { item } = data || { item: null };

  const { id, type, team_assignee_id } = item || { id: null };

  const org = await Organization.findOne(
    {
      organizationId: organizationId,
    },
    { upsert: false, new: false, setDefaultsOnInsert: false }
  );
  const feedbackDoc = await Feedback.findOne(
    {
      intercomTopicId: id,
      organizationId: organizationId,
    },
    { upsert: false, new: false, setDefaultsOnInsert: false }
  );
  const decryptAccesstoken = org?.intercomAccessToken && decrypt(org?.intercomAccessToken);

  if (id) {
    if (decryptAccesstoken) {
      axios
        .get(`https://api.intercom.io/conversations/${id}?${query}`, {
          headers: {
            'Intercom-Version': '2.11',
            Authorization: `Bearer ${decryptAccesstoken}`,
          },
        })
        .then(async (response: any) => {
          const responseData = response.data;

          const conversationParts = responseData?.conversation_parts.conversation_parts;
          const date = responseData.created_at;

          // Add the source body data to the conversation parts array
          const allParts = [
            ...conversationParts,
            { part_type: 'source', body: responseData?.source.body, created_at: date },
          ];
          const sortedAllParts = allParts.sort((a, b) => a.created_at - b.created_at);

          const filteredBodyTexts = sortedAllParts
            .filter(
              (part) =>
                (part.part_type === 'comment' || part.part_type === 'assignment' || part.part_type === 'source') &&
                part.body
            ) // Ensure part has a body
            .map((part) => {
              let authorIdentifier = '';
              if (part.author) {
                if (part.author.name) {
                  authorIdentifier = `**${part.author.name}**: `;
                } else if (part.author.email) {
                  const emailName = part.author.email.split('@')[0];
                  authorIdentifier = `**${emailName}**: `;
                }
              }
              return `${authorIdentifier}${part.body}` + '\n';
            })
            .join('\n\n');

          console.log('[filteredBodyTexts in Intercom]', filteredBodyTexts);

          let newDate = new Date(date * 1000);

          // Format the date to ISO string without the timezone part
          let isoString = newDate.toISOString().split('.')[0];

          // Append the hardcoded milliseconds and offset
          const newDateFormat = `${isoString}.555+00:00`;

          const intercomInfo = {
            feedback: filteredBodyTexts,
            date: newDateFormat,
            organizationId: organizationId,
            category: 'others',
            interestedUsers: [],
            interestedChannels: { channelName: null, channelID: null },
            source: 'intercom',
            sourceData: { intercom: null },
            intercomTopicId: responseData?.id,
            tags: team_assignee_id ? [team_assignee_id.toString()] : [],
          };
          if (feedbackDoc) {
            await Feedback.findOneAndUpdate(
              { intercomTopicId: responseData?.id, organizationId: organizationId }, // Query: Find a document with a specific conversation id and org id
              { $set: intercomInfo },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            ).then(async () => {
              await axios
                .post(
                  `${feedbackGPTAPI}/weaviate_utils`,
                  {
                    task: 'update_weaviate_record',
                    weaviate_uid: feedbackDoc?.weaviateId,
                    organization_id: organizationId,
                    feedback: filteredBodyTexts,
                  },
                  { timeout: 20000 }
                )
                .then(async (response) => {
                  console.log('[feedback waivate response in Intercom Webhook]', response.data);
                  await index
                    .partialUpdateObject(
                      { ...intercomInfo, objectID: feedbackDoc._id },
                      {
                        createIfNotExists: true,
                      }
                    )
                    .then((res: any) => {
                      console.log('%% algoliaRes', res);
                    })
                    .catch((err: any) => {
                      console.log('%% algoliaRes', err);
                    });
                  res.status(200).json({ status: 'success' });
                })
                .catch((error) => {
                  console.log('[feedback waivate error in Intercom webhook API]', error);
                  res.status(400).json({ status: 'error' });
                });
            });
          } else {
            const newFeedbackDetail = { ...intercomInfo };

            await Feedback.create(newFeedbackDetail).then((feedbackResponse) => {
              axios
                .post(
                  `${feedbackGPTAPI}/insert_data`,
                  {
                    organization_id: organizationId,
                    source: 'intercom',
                    mongo_id: feedbackResponse._id.toString(),
                  },
                  {
                    headers: {
                      'Content-type': 'application/json',
                    },
                  }
                )
                .then(async (response: any) => {
                  console.log('END processFromintercom WEAVIATE in insert Data', response?.data);
                  await index
                    .partialUpdateObject(
                      { ...intercomInfo, objectID: feedbackResponse?._id },
                      {
                        createIfNotExists: true,
                      }
                    )
                    .then((res: any) => {
                      console.log('%% algoliaRes', res);
                    })
                    .catch((err: any) => {
                      console.log('%% algoliaRes', err);
                    });
                  res.status(200).json({ status: 'success' });
                })
                .catch((error: any) => {
                  console.error('Webhhook Error sending message from inercom:', error.response);
                  res.status(400).json({ status: 'error' });
                });
            });
          }
        })
        .catch((error) => {
          console.error('[error in Intercom webhook]', error.response);
          res.status(403).json({ status: 'error' });
        });
    } else {
      res.status(404).json({ status: 'access token not found' });
    }
  } else if (type === 'ping') {
    res.status(200).json({ status: 'This is a ping notification test message.' });
  }
};

export default {
  get,
};
