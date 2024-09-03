import { RequestHandler } from 'express';
import { User } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const searchCount = req.query.searchCount as string;
    const enable = req.query.enable as string;
    const uid = req.query.uid as string;

    const userSearch = {
      search_limit_user_only: enable,
      userSearchCount: searchCount,
    };

    await User.findOneAndUpdate(
      { userId: uid },
      { $set: userSearch },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).then((search: any) => {
      res.status(200).json(search);
    });
    // }
  } catch (error: any) {
    console.log('error', error);
    console.error(`Error running query in user count: ${error}`);
    next(error);
  }
};

export default {
  get,
};
