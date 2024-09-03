import { RequestHandler } from 'express';
import { getSlackApiForOrganization } from '../utils/getSlackApiForOrganization';
import { Organization } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  const uid = req.query.uid as string;
  const organizationId = req.query.organizationId as string;

  try {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const web = await getSlackApiForOrganization(organizationId);
    const org = await Organization.findOne({ organizationId });

    // Ensure org.bot.token is defined before calling admin.apps.uninstall
    if (!org?.bot?.token) {
      throw new Error('Bot token not found.');
    }

    // Call admin.apps.uninstall method with the correct token
    const result = await web.apps.uninstall({
      client_id: clientId || '',
      client_secret: clientSecret || '',
      token: org?.bot?.token,
    });

    res.status(200).json({ uninstall: true });
  } catch (error) {
    console.error(`[Error running uninstall query]: ${error}`);
    next(error);
  }
};

export default {
  get,
};
