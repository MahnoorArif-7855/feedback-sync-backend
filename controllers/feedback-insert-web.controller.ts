import { Request, RequestHandler } from 'express';
import { Feedback } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const data = req.body;
    Feedback.create(data)
      .then(async (response) => {
        res.status(200).json(JSON.stringify(response));
      })
      .catch((error: any) => {
        console.log('error------', error);
        next(error);
      });
    // }
  } catch (error) {
    console.error(`Error inserting feedback: ${error}`);
    next(error);
  }
};

export default {
  get,
};
