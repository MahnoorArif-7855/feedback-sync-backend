import { Request, RequestHandler } from 'express';
import { User } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const userID = req.body.userId as string;
    const lastActivity = req.body.lastActivity as string;
    const lastActivityDate = req.body.lastActivityDate as string;

    await User.findOneAndUpdate(
      {
        userId: userID,
      },
      { lastActivity: lastActivity, lastActivityDate: lastActivityDate },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(true);
  } catch (error) {
    console.error(`Error running last activity query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
