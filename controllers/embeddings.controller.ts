import { RequestHandler } from 'express';
import embeddingsService from '../services/embeddings.service';

const create: RequestHandler = async (req, res, next) => {
  try {
    // pulls all feedbacks from the database and creates embeddings for each
    res.json(await embeddingsService.create());
  } catch (error) {
    console.error(`Error while creating embeddings: ${error}`);
    next(error);
  }
};

export default {
  create,
};
