import { RequestHandler } from 'express';
import { Organization } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    // const authvalidation = req.user;
    // if (authvalidation) {
    const organizationId = req.query.organizationId as string;
    await Organization.findOneAndUpdate(
      {
        organizationId: organizationId,
      },
      { $inc: { searchCount: 1 } },
      { new: true }
    ).then((user: any) => {
      res.status(200).json(user);
    });
    // }
  } catch (error) {
    console.error(`Error running userDetails query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
