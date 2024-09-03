import { Request, RequestHandler } from 'express';
import { User } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    await User.find().then((users: any) => {
      res.status(200).json(users);
    });
    // }
  } catch (error) {
    console.error(`Error running userList query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
