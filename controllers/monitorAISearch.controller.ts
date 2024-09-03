import { Request, RequestHandler } from 'express';
import { Search } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const organizationId = req.query.organizationId as string;
    await Search.find({
      organizationId: organizationId,
    }).then((monitorAISearch: any) => {
      res.status(200).json(monitorAISearch);
    });
  } catch (error) {
    console.error(`Error running monitor query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
