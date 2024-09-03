import { RequestHandler } from 'express';
import { WebClient } from '@slack/web-api';
import { Organization } from '../database';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const { organizationId, feedback } = req.body;

    console.log('SENDING SLACK NOTIFICATIONS ^^^ -->>>', req.body);

    const organizationInDB: any[] = await Organization.find({
      organizationId: organizationId,
    });
    const { bot, automatic_update_channel_Id } = organizationInDB[0] || {
      bot: null,
    };
    const web = new WebClient(bot?.token);
    let textFeedback =
      "*Welcome to Feedback Sync's Weekly Analysis! For a deeper dive, head to your customer feedback <https://feedbacksync.ai/dashboard/library|library> and <https://feedbacksync.ai/dashboard/search|dashboard>.*\n";
    feedback?.forEach((fdback: { heading: string; keywords: string[] }) => {
      const message = `\n*${fdback.heading}* \n${parseKeyWords(
        fdback.keywords
      )}\n`;
      textFeedback = textFeedback + message;
    });

    automatic_update_channel_Id &&
      (await web.chat.postMessage({
        channel: automatic_update_channel_Id,
        text: textFeedback,
      }));

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error(
      `SENDING SLACK NOTIFICATIONS Error running query in slack notification: ${error.response}`
    );
    next(error);
  }
};

const parseKeyWords = (keywords: string[]) => {
  let parsedText = '';

  keywords?.forEach((word) => {
    const text = `\n${word}\n`;
    parsedText = parsedText + text;
  });
  return parsedText;
};

export default {
  get,
};
