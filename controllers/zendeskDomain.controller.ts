import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { Organization } from '../database';

const get: RequestHandler = async (req: Request, res: Response, next) => {
  const data = req.body;
  const { organizationId, zendeskInfo } = data;
  const { domain, email, APIToken } = zendeskInfo;
  await Organization.findOneAndUpdate(
    { organizationId: organizationId },
    {
      $set: {
        zendeskSubDomain: domain,
        zendeskEmail: email,
        zendeskAPIToken: APIToken,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true } // Options: Return the updated document
  );
  res.status(200).json({ status: 'success' });
};
export default {
  get,
};
