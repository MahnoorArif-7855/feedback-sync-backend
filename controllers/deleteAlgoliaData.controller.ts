import { RequestHandler } from 'express';

const algoliasearch = require('algoliasearch');

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const organizationId = req.query.organizationId as string;
    console.log('[Delete Algolia Data]  organizationId', organizationId);

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
          filters: `organizationId:${organizationId}`,
          page,
        });

        hits = currentHits;
        console.log('currentHits', currentHits.length);

        if (hits.length > 0) {
          // Get the objectIDs of the matching records
          const objectIDs = hits.map((hit: { objectID: any }) => hit.objectID);

          // Delete the records by objectIDs
          const deletionResult = await index.deleteObjects(objectIDs);

          console.log(`${deletionResult.objectIDs.length} records deleted.`);
        }

        page += 1;
      } while (hits.length > 0);
      res.status(200).json({ delete: true });
    } catch (error) {
      console.error('Error deleting records:', error);
    }
  } catch (error) {
    console.error(`Error running data deletion algolia data: ${error}`);
    next(error);
  }
};

export default {
  get,
};
