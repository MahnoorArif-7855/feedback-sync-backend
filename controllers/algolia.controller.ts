import { RequestHandler } from 'express';
const algoliasearch = require('algoliasearch');

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const data = req.body;

    const client = algoliasearch(
      process.env.ALGOLIA_APP_ID,
      process.env.ALGOLIA_API_KEY
    );
    const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME);
    index
      .saveObject(data, { autoGenerateObjectIDIfNotExist: true })
      .wait()
      .then(() => {
        res.status(200).json(JSON.stringify({ success: true }));
      })
      .catch((error: any) => {
        console.log(error);
        next(error);
      });
  } catch (error) {
    console.error(`Error running create ticket query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
