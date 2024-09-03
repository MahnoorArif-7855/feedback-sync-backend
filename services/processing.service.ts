require('dotenv').config();

import { Document } from 'mongodb';
import * as weaviateService from '../services/weaviate.service';

import { ORGANIZATION_STREAM } from '../utils/constant';

function processInsertedDocument(document: Document, streamType: string) {
  console.log(` \n\n processInsertedDocument streamType = ${streamType}\n\n `);

  if (streamType === ORGANIZATION_STREAM) {
    // Creates the Weaviate class schema(s) if they don't already exist
    return weaviateService.createTenant(document);
  }
}

export default {
  processInsertedDocument,
};
