import { Organization } from '../database';
import { WebClient } from '@slack/web-api';

const oauthClient = new WebClient();

export const getSlackApiForOrganization = async (organizationId: string) => {
  const org = await Organization.findOne({ organizationId });

  if (!org?.bot) {
    throw new Error('Bot not found');
  }

  if (org.bot.expiresAt * 1000 < Date.now()) {
    const result = await oauthClient.apiCall('oauth.v2.access', {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: org.bot?.refreshToken,
    });

    if (!result.ok) {
      throw new Error('Failed to refresh token');
    }

    const { access_token, refresh_token, expires_in } = result as any;

    org.bot.token = access_token;
    org.bot.refreshToken = refresh_token;
    org.bot.expiresAt = Math.round(Date.now() / 1000) + expires_in; // Slack dates are seconds since epoch
    await org.save();

    console.log(`[getSlackApiForOrganization] Token refreshed for ${org._id}`);
  }

  return new WebClient(org.bot.token);
};
