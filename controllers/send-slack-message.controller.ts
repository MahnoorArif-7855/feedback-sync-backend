import { RequestHandler } from 'express';

import { Organization } from './../database';
import axios from 'axios';
import { WebClient } from '@slack/web-api';
import { renderListItem } from '../utils/referenceLink';
import { setTimeout } from 'node:timers/promises';

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const consoleLog: string[] = [];
    const { organizationId } = req.body;
    console.log('send slack notification');
    consoleLog.push('\n\n[send slack notification]');
    console.log('organizationId', organizationId);
    consoleLog.push(`\n\n[organizationId ${organizationId}]`);
    const organization = await Organization.findOne({
      organizationId: organizationId,
    });
    consoleLog.push(`\n\n[organization.organizationName ${organization?.organizationName}]`);
    console.log('organization?.organizationName', organization?.organizationName);

    const channelId = organization?.automatic_update_channel_Id;
    const bot = organization?.bot;

    if (channelId) {
      await axios
        .post(
          `${process.env.FEEDBACK_GPT_WEAVIATE_API}/analysis`,
          {
            organization_id: organization?.organizationId,
            analysis_type: 'overall',
            days: 7,
            cache_data: false,
          },
          { timeout: 20000 }
        )
        .then(
          async (response: {
            data: {
              error: string;
              data: any;
              analyzed_data: any;
            };
          }) => {
            const analyzedData = response?.data.analyzed_data || [];
            const web = new WebClient(bot?.token);
            const maxItemsToShow = 2;

            if (analyzedData.length >= 5) {
              let analyzedInfo = '';
              let message = '';
              let textFeedback = `*Welcome to Feedback Sync's Weekly Analysis! For a deeper dive, head to your customer feedback <${process.env.APP_URL}/dashboard/library|library> and <${process.env.APP_URL}/dashboard/search|dashboard>.*\n`;

              analyzedData
                ?.sort((a: { id: number }, b: { id: number }) => a.id - b.id)
                .forEach((data: any) => {
                  const { document_ids } = data;
                  if (data?.data) {
                    data?.data.forEach(async (fdback: { heading: string; keywords: string[] }) => {
                      const encodedSection = encodeURIComponent(fdback.heading);
                      fdback?.keywords.slice(0, maxItemsToShow).forEach((keywords: string) => {
                        analyzedInfo = analyzedInfo + `\n` + renderListItem(keywords, document_ids, encodedSection);
                      });

                      message = `\n*${fdback.heading}* \n${analyzedInfo}\n`;
                      if (fdback.keywords.length > maxItemsToShow) {
                        message += `\n<${process.env.APP_URL}/dashboard/analysis?section=${encodedSection}|See more>`;
                      }
                    });
                    textFeedback = textFeedback + message;
                    analyzedInfo = '';
                  }
                });

              channelId &&
                (await web.chat
                  .postMessage({
                    channel: channelId,
                    text: textFeedback,
                  })
                  .then((response) => {
                    consoleLog.push(`response in postMessage when channelId exist ###SUCCESS }`);
                    console.info(consoleLog.toString());
                    res.status(200).json({ message: 'sending notification' });
                  })
                  .catch((error) => {
                    consoleLog.push(`error in postMessage when channelId exist ### ERROR ${error}`);
                    console.error(consoleLog.toString());
                    res.status(402).json({ message: 'error in auth - not_authed' });
                  }));
            } else if (analyzedData.length === 0 || analyzedData.length < 5 || response?.data?.error) {
              channelId &&
                (await web.chat
                  .postMessage({
                    channel: channelId,
                    text: `Whoops, there weren't enough pieces of feedback to generate an analysis this week. Now's great time to set-up new <${process.env.APP_URL}/dashboard/integrations|integrations> and keep the feedback comming.`,
                  })
                  .then((response) => {
                    consoleLog.push(
                      `response in postMessage when no data exist ###SUCCESS ${JSON.stringify(response)}`
                    );
                    console.info(consoleLog.toString());
                    res.status(200).json({ success: true });
                  })
                  .catch((error) => {
                    consoleLog.push(`error in postMessage when no data exist ### ERROR ${JSON.stringify(error)}`);
                    console.error(consoleLog.toString());
                    res.status(402).json({ message: 'error in auth - not_authed' });
                  }));
            }
          }
        )
        .catch((error) => {
          res.status(402).json({ message: 'Error sending notification' });
          consoleLog.push(`feedback waivate error - slack send message, ${JSON.stringify(error)}`);
          console.error('feedback waivate error - slack send message', error);
          console.info(consoleLog.toString());
        });
    } else {
      res.status(200).json({
        message: 'Please add automatic channel id in order to get weekly feedback',
      });
    }
  } catch (error) {
    console.error(`Error running slack feedback query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
