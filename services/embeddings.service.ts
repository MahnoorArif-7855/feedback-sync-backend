import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { WeaviateStore } from 'langchain/vectorstores/weaviate';

import { Feedback } from '../database';
import { weaviateClient, getStore, METADATA_KEYS } from './weaviate.service';
import { Document } from 'mongodb';
import openaiService from './openai.service';
import config from '../config';

// Not Use
async function create() {
  const feedbacks = await Feedback.find();
  const feedbacksText = feedbacks.map(({ feedback }) => feedback);
  const feedbacksMetadata = feedbacks.map(({ id, category }) => ({
    mongoId: id,
    source: null,
    category: category?.toLowerCase() || null,
  }));

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });
  const docs = await textSplitter.createDocuments(
    feedbacksText,
    feedbacksMetadata
  );
  console.log(`Created ${docs.length} documents`);

  await WeaviateStore.fromDocuments(
    docs,
    new OpenAIEmbeddings({}, openaiService.config),
    {
      client: weaviateClient,
      indexName: 'Feedback',
      metadataKeys: METADATA_KEYS,
      textKey: 'feedback',
    }
  );
  console.log('Created Weaviate vector store');

  return { success: true };
}

async function createFromMongoDocument({ document }: { document: Document }) {
  await weaviateClient.data
    .creator()
    .withClassName(config.WEAVIATE_CLASS_NAME || '')
    .withProperties({
      feedback: document.feedback,
      mongoId: document.id || document._id.toString(),
      category: document.category?.toLowerCase() || null,
      organizationId: document.organizationId || null,
    })
    .withTenant(document.organizationId)
    .do();

  // console.log(JSON.stringify(result, null, 5)); // the returned value is the object

  return { success: true };
}

export default {
  create,
  createFromMongoDocument,
};
