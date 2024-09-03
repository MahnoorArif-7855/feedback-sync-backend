import { RequestHandler } from 'express';
import { Feedback } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const mongoId = req.query.mongoId as string;
    await Feedback.findById(mongoId).then((feedbacks: any) => {
      res.status(200).json(feedbacks);
    });
  } catch (error) {
    console.error(`Error running searchinfo query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
