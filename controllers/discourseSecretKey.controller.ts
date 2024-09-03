import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { Organization } from '../database';

const get: RequestHandler = async (req: Request, res: Response, next) => {
  const data = req.body;
  const { organizationId, secretKey } = data;
  await Organization.findOneAndUpdate(
    { organizationId: organizationId },
    {
      $set: {
        discourseSecretKey: secretKey,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true } // Options: Return the updated document
  );
  res.status(200).json({ status: 'success' });
};
export default {
  get,
};
