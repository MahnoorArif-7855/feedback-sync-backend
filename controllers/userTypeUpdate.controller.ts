import { RequestHandler } from 'express';
import { User } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const uid = req.query.uid as string;
    const type = req.query.type as string;
    await User.findOneAndUpdate(
      {
        userId: uid,
      },
      { $set: { type: type } },
      { new: true }
    ).then((user: any) => {
      res.status(200).json(user);
    });
  } catch (error) {
    console.error(`Error running user type query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
