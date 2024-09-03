import { RequestHandler } from 'express';
import { getSlackApiForOrganization } from '../utils/getSlackApiForOrganization';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const { organizationId, channelId } = req.body;

    const web = await getSlackApiForOrganization(organizationId);

    const channels = await web.conversations.info({ channel: channelId });

    res.status(200).json({ channelId: channels?.channel?.id, channelName: channels?.channel?.name });
  } catch (error) {
    console.error(`[Error running data slack-auto-ingest channel api]: ${error}`);
    next(error);
  }
};

export default {
  get,
};
