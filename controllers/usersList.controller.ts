import { Request, RequestHandler } from 'express';
import { Organization, User } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const userList = await Organization.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'organizationId',
          foreignField: 'organizationId',
          as: 'userInfo',
        },
      },
    ]).exec();

    res.status(200).json(userList);
  } catch (error) {
    console.error(`Error running organization query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
