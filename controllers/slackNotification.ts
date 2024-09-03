import { RequestHandler } from 'express';
import { WebClient } from '@slack/web-api';
import { Organization } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const { users, channels, organizationId, feedback } = req.query;

    console.log('SENDING SLACK NOTIFICATIONS -->>>', req.query);

    console.log(
      `SENDING SLACK NOTIFICATIONS -->>>
      users ${users},
      channels ${channels}, 
      organizationId : ${organizationId},
      feedback ${feedback}`
    );
    const organizationInDB: any[] = await Organization.find({
      organizationId: organizationId,
    });
    const { bot } = organizationInDB[0] || { bot: null };
    const web = new WebClient(bot?.token);
    users &&
      users.length > 0 &&
      users.map(async (user: any) => {
        await web.chat.postMessage({
          // token: process.env.SLACK_BOT_TOKEN,
          channel: user,
          text: feedback,
        });
      });

    channels &&
      (await web.chat.postMessage({
        channel: channels.id,
        text: feedback,
      }));

    console.log('SENDING SLACK NOTIFICATIONS ,success');
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error(
      `SENDING SLACK NOTIFICATIONS Error running query in slack notification: ${error.response.data}`
    );
    next(error);
  }
};

export default {
  get,
};
