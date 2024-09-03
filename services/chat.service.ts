import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { getStore } from './weaviate.service';
import { Document } from 'langchain/document';
import openaiService from './openai.service';

// Not Use
async function completion(query: string, organization: string | null) {
  const store = await getStore('Feedback', organization);
  const model = new OpenAI({}, openaiService.config);
  const chain = RetrievalQAChain.fromLLM(model, store.asRetriever(10), {
    returnSourceDocuments: true,
    verbose: true,
  });

  const res = await chain.call({
    query,
  });

  return {
    text: res.text?.trim(),
    sourceDocumentIds: res.sourceDocuments.map(
      (doc: Document) => doc.metadata.mongoId
    ),
  };
}

export default {
  completion,
};
