import { WeaviateFilter } from 'langchain/vectorstores/weaviate';
import { weaviateClient } from './weaviate.service';
import { WeaviateSearchResult } from '../types';
import config from '../config';

export async function similaritySearch({
  query,
  className,

  limit = 6,
  organizationid,
  category,
}: {
  query: string;
  className?: string;
  limit?: number;
  category: any;
  organizationid: any;
}): Promise<WeaviateSearchResult[]> {
  console.log('query', query);
  console.log('category', category);
  console.log('config.WEAVIATE_CLASS_NAME ', config.WEAVIATE_CLASS_NAME);

  if (config.WEAVIATE_CLASS_NAME) {
    const response = await weaviateClient.graphql
      .get()
      .withClassName(config.WEAVIATE_CLASS_NAME)
      .withFields(
        'feedback organizationId mongoId category _additional { id certainty }'
      )
      .withTenant(organizationid || '')
      .withNearText({ concepts: [query] })

      .withWhere({
        operator: 'And',
        operands: [
          {
            path: ['category'],
            operator: 'Equal',
            valueText: category,
          },
        ],
      })
      .withLimit(limit)
      .do();

    console.log(JSON.stringify(response, null, 2));

    return response.data.Get[config.WEAVIATE_CLASS_NAME].map((item: any) => {
      console.log('item', item);

      return {
        feedback: item.feedback,
        mongoId: item.mongoId,
        source: 'g2',
        category: item.category,
        organization: item.organizationId,
        score: {
          certainty: item._additional.certainty,
        },
      };
    });
  } else {
    console.log(
      'similaritySearch: WEAVIATE_CLASS_NAME issue ',
      config.WEAVIATE_CLASS_NAME
    );
    return [
      {
        feedback: 'null',
        mongoId: 'null',
        source: 'null',
        category: 'null',
        organization: 'null',
      },
    ];
  }

  // const results = await store.similaritySearchWithScore(query, limit, filter);
  // console.log('results', results);
  // return results.map((tuple) => {
  //   const result = tuple[0];
  //   const score = tuple[1];

  //   return {
  //     feedback: result.pageContent,
  //     mongoId: result.metadata.mongoId,
  //     source: result.metadata.source,
  //     category: result.metadata.category,
  //     organization: result.metadata.organization,
  //     score,
  //   };
  // });
}

export default {
  similaritySearch,
};
