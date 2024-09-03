import axios from 'axios';
import { RequestHandler } from 'express';
import { Feedback } from '../database';
import config from '../config';

const algoliasearch = require('algoliasearch');

const get: RequestHandler = async (req: any, res, next) => {
  // const data = req.query.orgId;
  const orgId = req.query.orgId;
  const feedbackId = req.query.feedbackId;

  const searchClient = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY,
    { protocol: 'https:' }
  );

  const index = searchClient.initIndex(process.env.ALGOLIA_INDEX_NAME);

  console.log('Delete Feedback', orgId, feedbackId);

  try {
    Feedback.deleteOne({
      _id: feedbackId,
      organizationId: orgId,
    })
      .then(async (resp) => {
        console.log('res deleted feedback', resp);
        index
          .deleteObject(feedbackId)
          .then(async (response: any) => {
            console.log('algolia response', response);

            const data = {
              task: 'delete_single_record',
              mongo_id: feedbackId,
              organization_id: orgId,
            };
            const updateResp = await deleteWeaviateData(data);
            console.log('#### delete feedback weaviate resp', updateResp);
            res.status(200).json(JSON.stringify({ success: true }));
          })
          .catch((error: any) => {
            console.log('erroralgolia response', error);
          });
      })
      .catch((err) => {
        console.log('err deleting feedback', err);
      });
  } catch (error) {
    console.error(`Error running delete query: ${error}`);
    next(error);
  }
};

const deleteWeaviateData = async (data: {
  task: string;
  mongo_id: string;
  organization_id: string;
}) => {
  console.log('-------- deleteWeaviateData organizationId-----', data);

  const feedbackGPTAPI = config.FEEDBACK_GPT_WEAVIATE_API;

  return await axios
    .post(
      `${feedbackGPTAPI}/weaviate_utils`,
      {
        ...data,
      },
      { timeout: 20000 }
    )
    .then((response) => {
      console.log(
        ' --------deleteWeaviateData Delete tenant response',
        response.data
      );
      return response.data;
    })
    .catch((error) => {
      console.log('-------- deleteWeaviateData tenant error', error.message);
    });
};

export default {
  get,
};
