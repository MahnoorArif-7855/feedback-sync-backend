// require('dotenv').config();
import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { Feedback } from '../../database';
import config from '../../config';
import axios from 'axios';

const get: RequestHandler = async (req: Request, res: Response, next) => {
  const feedbackGPTAPI = config.FEEDBACK_GPT_WEAVIATE_API;

  const payload = req.body;
  // console.log('req', req.params.id);
  console.log('payload', payload);

  const { post, topic, ping } = payload || { post: null, topic: null, ping: null };
  const organizationId = req.params.id;
  let feedbackText = '';
  let feedbackRawText = '';
  let userId = topic?.username || post?.username;

  if (post) {
    feedbackText = post?.cooked;
    feedbackRawText = post?.raw;
  }

  const discourseInfo = {
    feedback: `${feedbackRawText}`,
    discourseFeedback: `*${userId}*: ${feedbackText}`,
    date: topic?.created_at || post?.created_at,
    userId: userId,
    organizationId: organizationId,
    category: 'others',
    interestedUsers: [],
    interestedChannels: { channelName: null, channelID: null },
    source: 'discourse',
    sourceData: { discourse: payload },
    discourseTopicId: post?.topic_id,
    discourseCategoryName: post?.category_slug || '',
  };

  console.log('post?.topic_id', post?.topic_id);

  if (post?.topic_id) {
    // Find the existing document to retrieve the current feedback text
    const existingFeedback = await Feedback.findOne({
      discourseTopicId: post?.topic_id,
      organizationId: organizationId,
    });

    if (existingFeedback) {
      discourseInfo.discourseFeedback =
        (existingFeedback.discourseFeedback || '') + `<strong>${userId}</strong> : ${feedbackText}`;
    } else {
      discourseInfo.discourseFeedback = post?.topic_title + '<br>' + `<strong>${userId}</strong> : ${feedbackText}`;
    }

    console.log('discourseInfo', discourseInfo);

    await Feedback.findOneAndUpdate(
      { discourseTopicId: post?.topic_id, organizationId: organizationId }, // Query: Find a document with a specific discourseTopicId
      { $set: discourseInfo },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .then(async (responseData) => {
        if (existingFeedback) {
          existingFeedback?.weaviateId &&
            organizationId &&
            (await axios
              .post(
                `${feedbackGPTAPI}/weaviate_utils`,
                {
                  task: 'update_weaviate_record',
                  weaviate_uid: existingFeedback?.weaviateId,
                  organization_id: organizationId,
                  feedback: discourseInfo.feedback,
                },
                { timeout: 20000 }
              )
              .then((response) => {
                console.log('DISCOURSE feedback waivate response', response.data);
              })
              .catch((error) => {
                console.log('[ DISCOURSE THREAD Update in Weaviate ERROR]', error);
              }));
        } else {
          if (feedbackGPTAPI) {
            await axios
              .post(
                `${feedbackGPTAPI}/insert_data`,
                {
                  organization_id: organizationId,
                  source: 'discourse',
                  mongo_id: responseData._id,
                },
                {
                  headers: {
                    'Content-type': 'application/json',
                  },
                }
              )
              .then((response: any) => {
                console.log('SUCCESS DISCOURSE: OpenAPI', response?.data);
              })
              .catch((error: any) => {
                console.error('ERROR DISCOURSE: OpenAPI', error.response);
              });
          }
        }

        res.status(200).json({ status: 'success' });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ status: 'error', message: err.message });
      });
  } else if (ping) {
    res.status(200).json({ status: 'success' });
  }
};

export default {
  get,
};
