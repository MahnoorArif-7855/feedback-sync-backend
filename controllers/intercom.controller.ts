import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { Organization } from '../database';
import { encrypt } from '../utils/func';

const get: RequestHandler = async (req: Request, res: Response, next) => {
  const data = req.body;

  const { organizationId, appId, accessToken } = data;

  const encryptAccessToken = encrypt(accessToken);

  await Organization.findOneAndUpdate(
    { organizationId: organizationId },
    {
      $set: {
        intercomAppId: appId,
        intercomAccessToken: encryptAccessToken,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true } // Options: Return the updated document
  );
  res.status(200).json({ status: 'successfully save app id and access token' });
};
export default {
  get,
};
