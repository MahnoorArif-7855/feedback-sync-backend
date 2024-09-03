import { RequestHandler } from 'express';
import apifyService from '../../services/apify.service';

const get: RequestHandler = async (req, res, next) => {
  try {
    const { slug, limit, userId, organizationId } = req.query;

    if (!slug || typeof slug !== 'string') {
      throw new Error('No slug provided');
    }

    res.json(
      await apifyService.fetchG2Reviews({
        slug,
        limit: limit ? parseInt(String(limit)) : undefined,
        userId,
        organizationId,
      })
    );
  } catch (error) {
    console.error(`Error while creating embeddings: ${error}`);
    next(error);
  }
};

export default {
  get,
};
