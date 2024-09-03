require('dotenv').config();

import { ApifyClient } from 'apify-client';
import { Feedback } from '../database';
import { G2Review } from '../types';
import config from '../config';
import axios, { AxiosRequestConfig } from 'axios';
const algoliasearch = require('algoliasearch');

const client = new ApifyClient({
  token: config.APIFY_TOKEN,
});

const G2_EXPLORER_UID = 'jupri/g2-explorer';
const feedbackGPTAPI = config.FEEDBACK_GPT_WEAVIATE_API;

async function fetchG2Reviews({
  slug,
  limit,
  userId,
  organizationId,
}: {
  slug: string;
  limit?: number;
  userId?: any;
  organizationId?: any;
}) {
  const { defaultDatasetId } = await client.actor(G2_EXPLORER_UID).call({
    query: slug,
    limit: limit || 5,
    response_type: 'text',
    mode: 'review',
  });
  const response = await client.dataset(defaultDatasetId).listItems();
  const items = response.items as G2Review[];

  const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
  const index = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME);

  const existingItems = await Feedback.find({
    'sourceData.g2.id': { $in: items.map((item) => item.id) },
  });

  const newItems = items.filter(
    (item) =>
      !existingItems.some(
        (existingItem) => existingItem.sourceData.g2?.id === item.id && existingItem.organizationId === organizationId
      )
  );

  if (newItems.length === 0) {
    feedbackGPTAPI &&
      axios
        .post(
          `${feedbackGPTAPI}/insert_data`,
          {
            organization_id: organizationId,
            source: 'g2',
            batched_processing: true,
          },
          {
            headers: {
              'Content-type': 'application/json',
            },
          }
        )
        .then((response: any) => {
          console.log('WEAVIATE Feedback API: SUCCESS insert_data for g2', response.data);
        })
        .catch((error: any) => {
          console.error('Error sending message:', error);
        });

    return {
      insertedDocs: existingItems,
      insertedCount: 0,
    };
  }

  try {
    const insertedDocs = await Feedback.insertMany(
      newItems.map((item) => {
        return {
          feedback: item.answers_raw || item.answers?.join('\n') || ' ',
          date: new Date(),
          organization: item.product.slug,
          userId: userId,
          organizationId: organizationId,
          source: 'g2',
          category: 'others',
          sourceData: {
            g2: item,
          },
        };
      })
    );
    const algoliaDocs = insertedDocs?.map((doc) => {
      const algoliaObj = {
        objectID: doc._id.toString(),
        feedback: doc.feedback,
        date: doc.date,
        organization: doc.organization,
        userId: doc.userId,
        source: doc.source,
        organizationId: doc.organizationId,
      };
      return algoliaObj;
    });

    index
      .saveObjects(algoliaDocs)
      .then((res: any) => {
        console.log('data added in algolia successfully', res);
      })
      .catch((error: any) => {
        console.log('algloia error');
        console.log(error);
      });

    feedbackGPTAPI &&
      axios
        .post(
          `${feedbackGPTAPI}/insert_data`,
          {
            organization_id: organizationId,
            source: 'g2',
            batched_processing: true,
          },
          {
            headers: {
              'Content-type': 'application/json',
            },
          }
        )
        .then((response: any) => {
          console.log('WEAVIATE Feedback API: SUCCESS insert_data for g2', response.data);
        })
        .catch((error: any) => {
          console.error('Error sending message:', error);
        });

    return {
      numInsertedDocs: insertedDocs.length,
      insertedDocs,
    };
  } catch (err) {
    console.error('Error inserting docs:', err);
    throw new Error('Error inserting docs');
  }
}

export default {
  fetchG2Reviews,
};
