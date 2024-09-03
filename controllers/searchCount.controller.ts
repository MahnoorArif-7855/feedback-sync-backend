import axios, { AxiosRequestConfig } from 'axios';
import { Request, RequestHandler } from 'express';
import { Admin } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const searchCount = req.query.searchCount as string;
    const type = req.query.type as string;

    const searchType =
      type === 'free'
        ? { 'pricing.freePlanWordsCount': searchCount }
        : { 'pricing.premiumPlanWordsCount': searchCount };

    await Admin.findOneAndUpdate(
      {},
      { $set: searchType },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).then((search: any) => {
      res.status(200).json(search);
    });
    // }
  } catch (error) {
    console.error(`Error running search count query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
