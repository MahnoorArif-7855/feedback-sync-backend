import weaviate, { WeaviateClass } from 'weaviate-ts-client';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { WeaviateStore } from 'langchain/vectorstores/weaviate';
import openaiService from './openai.service';
import config from '../config';
import { Document } from 'mongodb';

const WEAVIATE_SCHEME = config.WEAVIATE_SCHEME || 'http';
const WEAVIATE_HOST = config.WEAVIATE_HOST || 'localhost';
const WEAVIATE_API_KEY = config.WEAVIATE_API_KEY || '';
const OPENAI_API_KEY = config.OPENAI_API_KEY || '';
const weaviateClass = config.WEAVIATE_CLASS_NAME;

export const METADATA_KEYS = ['mongoId', 'source', 'category', 'organization'];

export const weaviateClient = weaviate.client({
  scheme: WEAVIATE_SCHEME,
  host: WEAVIATE_HOST,
  apiKey: new weaviate.ApiKey(WEAVIATE_API_KEY),
  headers: { 'X-OpenAI-Api-Key': OPENAI_API_KEY },
});

export async function createTenant(document: Document) {
  try {
    if (weaviateClass) {
      const getOrganizationId = document.organizationId;
      console.log('createTenant:  getOrganizationId', getOrganizationId);

      let wClass: WeaviateClass | null = null;

      try {
        wClass = await weaviateClient.schema.classGetter().withClassName(weaviateClass).do();
      } catch (err) {
        // assuming the class doesn't exist yet
        console.info(`${weaviateClass} class does not exist yet, creating it`);
      }

      if (!wClass) {
        await weaviateClient.schema
          .classCreator()
          .withClass({
            class: weaviateClass,
            multiTenancyConfig: { enabled: true },
            vectorizer: 'text2vec-openai', //  If set to "none" you must always provide vectors yourself. Could be any other "text2vec-*" also.
            moduleConfig: {
              'text2vec-openai': {
                model: 'ada',
                modelVersion: '002',
                type: 'text',
              },
            },
          })
          .do();
        console.info(`Created ${weaviateClass} class in Weaviate`);
      }

      const tenantsList = await weaviateClient.schema.tenantsGetter(weaviateClass).do();

      console.log('\n\ntenantsList\n\n', tenantsList);

      const check = tenantsList && tenantsList.find(({ name }) => name && name === getOrganizationId);

      if (!check) {
        let tenants = await weaviateClient.schema.tenantsCreator(weaviateClass, [{ name: getOrganizationId }]).do();
        console.log('tenants', tenants);
      }

      console.info(`Weaviate schema and tenant created: ${weaviateClass}`);
    } else {
      console.log('weaviateClass name doesnt exist', weaviateClass);
    }
  } catch (err) {
    let errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error(`Failed to initialize Weaviate schema: ${errorMsg}`);
  }
}
// Not Use
export async function deleteClass(className: string = 'Feedback') {
  try {
    await weaviateClient.schema.classDeleter().withClassName(className).do();

    console.log(`Deleted index ${className}`);
  } catch (err) {
    let errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error(`Failed to delete index ${className}: ${errorMsg}`);
  }
}

// Not Use
export async function getStore(className: string = 'Feedback', organizationName: string | null) {
  return WeaviateStore.fromExistingIndex(new OpenAIEmbeddings({}, openaiService.config), {
    client: weaviateClient,
    indexName: className,
    metadataKeys: METADATA_KEYS,
    textKey: 'feedback',
  });
}

export async function findObjectByMongoId(className: string = 'Feedback', mongoId: string) {
  try {
    const object = await weaviateClient.graphql
      .get()
      .withClassName(className)
      .withFields('feedback mongoId source')
      .withWhere({
        path: ['mongoId'],
        operator: 'Equal',
        valueString: mongoId,
      })
      .do();
    return object;
  } catch (err) {
    let errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error(`Failed to find object by mongoId ${mongoId}: ${errorMsg}`);
    return null;
  }
}
