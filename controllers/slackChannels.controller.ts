import { RequestHandler } from 'express';
import { getSlackApiForOrganization } from '../utils/getSlackApiForOrganization';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const { organizationId, channelsIds } = req.body;

    const web = await getSlackApiForOrganization(organizationId);

    const channelPromises = channelsIds.map(async (info: any) => {
      const channels = await web.conversations.info({ channel: info });
      if (channels?.channel?.name) {
        return {
          id: channels?.channel?.id,
          name: channels?.channel?.name,
        };
      }
    });

    const resolvedChannels = await Promise.all(channelPromises);
    const channelName = resolvedChannels.filter(Boolean);
    res.status(200).json(channelName);
  } catch (error) {
    const { organizationId } = req.body;
    console.error(`Error Fetching in slack channel api in OrganizationId ${organizationId}: ${error}`);
    next(error);
  }
};

export default {
  get,
};
