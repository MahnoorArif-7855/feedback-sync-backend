import { RequestHandler } from 'express';
import searchService from '../services/search.service';
import { WeaviateFilter } from 'langchain/vectorstores/weaviate';

const get: RequestHandler = async (req, res, next) => {
  try {
    const { q, category, organizationid } = req.query;
    console.log('q, category, organizationid', q, category, organizationid);

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        message: 'Bad Request - q is required',
      });
    }

    res.json(
      await searchService.similaritySearch({
        query: q,
        category,
        organizationid,
      })
    );
  } catch (error) {
    console.error(`Error running search query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
