import { RequestHandler } from 'express';
import { getSlackApiForOrganization } from '../utils/getSlackApiForOrganization';
import { Organization } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  const uid = req.query.uid as string;

  const organizationId = req.query.organizationId as string;
  const appStatus = 'app revoked';

  try {
    const web = await getSlackApiForOrganization(organizationId);
    const org = await Organization.findOneAndUpdate(
      { organizationId: organizationId }, // Query: Find a document with a specific organizationId
      { $set: { appStatus: appStatus } },
      { upsert: true, new: true, setDefaultsOnInsert: true } // Options: Return the updated document
    );
    const { automatic_update_channel_Id } = org || { automatic_update_channel_Id: null };
    automatic_update_channel_Id &&
      (await web.chat.postMessage({
        channel: automatic_update_channel_Id || '',
        text: 'Your Slack application disconnected from your web application',
      }));
    const result = await web.auth.revoke({
      token: org?.bot?.token,
    });

    res.status(200).json({ disconnect: true });
  } catch (error) {
    console.error(`[Error running revoke query]: ${error}`);
    next(error);
  }
};

export default {
  get,
};
