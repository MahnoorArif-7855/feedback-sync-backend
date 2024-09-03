// require('dotenv').config();
import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { Feedback } from '../../database';
import config from '../../config';
import axios from 'axios';
import { Organization } from '../../database';
const algoliasearch = require('algoliasearch');
const get: RequestHandler = async (req: Request, res: Response, next) => {
  const feedbackGPTAPI = config.FEEDBACK_GPT_WEAVIATE_API;
  const payload = req.body;

  console.log('payload', payload);

  const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
  const index = algoliaClient.initIndex(config.ALGOLIA_INDEX_NAME);
  const subStringIndex = payload?.url?.indexOf('.');
  const domain = payload?.url?.substring(0, subStringIndex);

  const org: any[] = await Organization.find({
    zendeskSubDomain: domain,
  });
  const { organizationId, zendeskEmail, zendeskAPIToken } = org[0] || { bot: null };
  const currentDate: Date = new Date();
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate: string = currentDate.toLocaleDateString('en-US', options);

  const feedbackTitleDescription = `Status: ${payload?.status || '-'} \n\n ${payload?.title || ''} \n\n ${
    payload?.subject || ''
  }\n ${payload?.description || ''}  `;

  const ticketId = payload.ticket_id;

  if (!zendeskEmail || !zendeskAPIToken) {
    res.status(400).json({
      error: 'zendesk api token or zendesk domain or zendesk email is wrong',
    });
    return;
  }

  if (payload.testWebhook) {
    res.status(200).json({ status: 'success' });
    return;
  }

  const base64EncodedString = btoa(`${zendeskEmail}/token:${zendeskAPIToken}`);

  const commentsOptions = {
    method: 'GET',
    url: `https://feedbacksyncsupport.zendesk.com/api/v2/tickets/${ticketId}/comments`,
    headers: {
      authorization: `Basic ${base64EncodedString}`,
      'Content-Type': 'application/json',
    },
    params: {
      archive_immediately: false,
    },
  };
  console.log('commentsOptions', commentsOptions);

  let feedbackComment = null;

  await axios(commentsOptions)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      const com = response.data.comments.map((zen: any) => {
        return zen.plain_body;
      });
      feedbackComment = com.join('\n\n');
    })
    .catch((error) => {
      console.log('commentsOptions', error.response.data);
      res.status(400).json({
        error: 'zendesk api token or zendesk domain or zendesk email is wrong.',
        description: error.response.data,
      });
      return;
    });
  console.log('feedbackComment  ---------------', feedbackComment);

  if (feedbackComment) {
    const zendeskExitingInfo = {
      feedback: `${feedbackTitleDescription}  ${feedbackComment} || '' `,
      zendeskComment: `${feedbackTitleDescription}  ${feedbackComment} || '' `,
      date: payload.due_date && payload.due_date.length > 0 ? payload.due_date : formattedDate,
      organizationId: organizationId,
      category: 'others',
      interestedUsers: [],
      interestedChannels: { channelName: null, channelID: null },
      source: 'zendesk',
      sourceData: { zendesk: payload },
    };

    const feedbackDoc = await Feedback.findOne(
      {
        'sourceData.zendesk.url': payload?.url || '',
      },
      { upsert: false, new: false, setDefaultsOnInsert: false }
    );
    console.log('feedbackDoc', feedbackDoc);

    if (feedbackDoc) {
      const comments = `${feedbackTitleDescription}  \n  ${feedbackComment}`;
      const updatedData = { ...zendeskExitingInfo, zendeskComment: comments };
      await Feedback.findOneAndUpdate(
        {
          'sourceData.zendesk.url': payload?.url,
        },
        { $set: updatedData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log('feedbackDocv', feedbackDoc?.weaviateId);
      await axios
        .post(
          `${feedbackGPTAPI}/weaviate_utils`,
          {
            task: 'update_weaviate_record',
            weaviate_uid: feedbackDoc?.weaviateId,
            organization_id: organizationId,
            feedback: comments,
          },
          { timeout: 20000 }
        )
        .then(async (response) => {
          console.log('feedback waivate response', response.data);
          await index
            .partialUpdateObject(
              { ...zendeskExitingInfo, objectID: org[0]?._id },
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
          console.log('feedback waivate error', error);
          res.status(400).json({ status: 'error' });
        });
    } else {
      const newFeedbackDetail = { ...zendeskExitingInfo };
      console.log('newFeedbackDetail', newFeedbackDetail);

      await Feedback.create(newFeedbackDetail);

      if (feedbackGPTAPI) {
        axios
          .post(
            `${feedbackGPTAPI}/insert_data`,
            {
              organization_id: organizationId,
              source: 'zendesk',
            },
            {
              headers: {
                'Content-type': 'application/json',
              },
            }
          )
          .then(async (response: any) => {
            console.log('END processFromZendesk WEAVIATE Feedback API: processFrom Zendesk', response?.data);
            await index
              .partialUpdateObject(
                { ...newFeedbackDetail, objectID: org[0]?._id },
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
          })
          .catch((error: any) => {
            console.error('Webhhook Error sending message:', error.response);
          });
      }
      res.status(200).json({ status: 'success' });
    }
  }
};
export default {
  get,
};
