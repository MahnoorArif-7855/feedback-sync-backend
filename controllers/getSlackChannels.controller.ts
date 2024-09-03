import { RequestHandler } from 'express';
import { getSlackApiForOrganization } from '../utils/getSlackApiForOrganization';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const { organizationId, cursor } = req.body;

    const web = await getSlackApiForOrganization(organizationId);

    // Fetching a list of all channels for the organization
    const channelsList = await web.conversations.list({
      limit: 1000,
      cursor: cursor,
      exclude_archived: true,
    });

    const channels = channelsList.channels || [];
    const channelCursor = channelsList.response_metadata || {};

    const { next_cursor } = channelCursor || { next_cursor: '' };

    // Filter channels based on your criteria, e.g., by organizationId
    const organizationChannels = channels
      .map((channel) => {
        if (channel?.context_team_id === organizationId) {
          return {
            channelId: channel.id,
            channelName: channel.name,
          };
        }
      })
      .filter(Boolean);

    res.status(200).json({
      organizationChannels: organizationChannels,
      channelsPagination: next_cursor,
    });
  } catch (error) {
    console.error(`Error running data slack channels API: ${error}`);
    next(error);
  }
};

export default { get };
