import { RequestHandler } from 'express';
import {
  Feedback,
  User,
  Organization,
  FeedbackTags,
  AnalysisOutputs,
} from '../database';
import axios from 'axios';
import config from '../config';
const admin = require('firebase-admin');

const algoliasearch = require('algoliasearch');

// const parser = csv.parse({ columns: true });

const get: RequestHandler = async (req: any, res, next) => {
  try {
    // const data = req.body;
    const organizationId = req.query.organizationId as string;
    console.log('%% data delete feedback', organizationId);

    await Feedback.deleteMany({ organizationId: organizationId })
      .then(async (resp: any) => {
        console.log('### FEEDBACK DELETE RESPONSE', resp);

        // const deleteResp = await deleteOrganizationUsers(organizationId);
        // console.log('#### deleteOrganizationUsers resp', deleteResp);

        const tagsRes = await FeedbackTags.deleteMany({
          organizationId: organizationId,
        });
        console.log('%%% tagsRes', tagsRes);

        const analysis_outputsRes = await AnalysisOutputs.deleteMany({
          organizationId: organizationId,
        });
        console.log('%%% analysis_outputsRes', analysis_outputsRes);

        await deleteObjectsByOrganizationId(organizationId);

        const updateResp = await deleteWeaviateData(organizationId);
        console.log('#### updateResp resp', updateResp);

        res.status(200).send('Data deleted successfully.');
      })
      .catch((err: any) => {
        console.log('Error occured when deleting data', err);
        next(err);
      });
  } catch (error) {
    console.error(`Error running data deletion api: ${error}`);
    next(error);
  }
};

const deleteOrganizationUsers = async (orgId: string) => {
  const deleteFirebase = async () => {
    const users = await User.find({ organizationId: orgId });
    console.log('------deleteFirebase: users', users);
    users.map(async ({ userId, firebaseLogin }) => {
      if (firebaseLogin) {
        await admin
          .auth()
          .deleteUser(userId)
          .then(async (response: any) => {
            console.log('deleteFirebase ---- ', response);
          });
      }
    });
  };
  await deleteFirebase();
  const resp = await User.deleteMany({
    organizationId: orgId,
  })
    .then((res) => {
      console.log('deleteFirebase ---- ', res);
      return res;
    })
    .catch((error) => {
      console.error('delete organization feedbacks  error', error);
      return error;
    });
  return resp;
};

const deleteWeaviateData = async (orgId: string) => {
  console.log('[deleteWeaviateData] organizationId -', orgId);
  const feedbackGPTAPI = config.FEEDBACK_GPT_WEAVIATE_API;

  return await axios
    .post(
      `${feedbackGPTAPI}/weaviate_utils`,
      {
        tenant_id: orgId,
        task: 'delete_tenant_data',
        organization_id: orgId,
      },
      { timeout: 20000 }
    )
    .then((response) => {
      console.log(
        '  [deleteWeaviateData] Delete tenant response',
        response.data
      );
      return response.data;
    })
    .catch((error) => {
      console.log('[deleteWeaviateData] tenant error', error.message);
    });
};

async function deleteObjectsByOrganizationId(organizationIdToDelete: any) {
  try {
    const searchClient = algoliasearch(
      process.env.ALGOLIA_APP_ID,
      process.env.ALGOLIA_API_KEY,
      { protocol: 'https:' }
    );

    const index = searchClient.initIndex(process.env.ALGOLIA_INDEX_NAME);
    let page = 0;
    let hits;

    do {
      // Search for objects with the specified organizationId, paginating through results
      const { hits: currentHits } = await index.search('', {
        filters: `organizationId:${organizationIdToDelete}`,
        page,
      });

      hits = currentHits;

      if (hits.length > 0) {
        // Get the objectIDs of the matching records
        const objectIDs = hits.map((hit: { objectID: any }) => hit.objectID);

        // Delete the records by objectIDs
        const deletionResult = await index.deleteObjects(objectIDs);

        console.log(`${deletionResult.objectIDs.length} records deleted.`);
      }

      page += 1;
    } while (hits.length > 0);
  } catch (error) {
    console.error('Error deleting records:', error);
  }
}

export default {
  get,
};
