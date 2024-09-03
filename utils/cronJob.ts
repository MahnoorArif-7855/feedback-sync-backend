import { Feedback, Organization } from './../database';
import axios from 'axios';
import { WebClient } from '@slack/web-api';
import { renderListItem } from './referenceLink';
import { setTimeout } from 'node:timers/promises';

export async function cronJobApi() {
  console.log('Cron job executed at:', new Date().toLocaleString());
  const organizations = await Organization.find({
    automatic_update_channel_Id: { $exists: true },
  });

  if (organizations.length) {
    organizations?.map(async (org) => {
      const consoleLog: string[] = [];
      consoleLog.push(`\n\n[<<<<<<<< CRON JOB Start ${new Date().toLocaleString()}>>>>>>>>>]`);
      const { automatic_update_channel_Id, bot } = org;
      consoleLog.push(`\n\n[org-name ${org.organizationName} - ID: ${org.organizationId}] `);

      if (automatic_update_channel_Id) {
        consoleLog.push(`\n\n[channel-id ${automatic_update_channel_Id}]`);
        await axios
          .post(
            `${process.env.FEEDBACK_GPT_WEAVIATE_API}/analysis`,
            {
              organization_id: org?.organizationId,
              analysis_type: 'overall',
              days: 7,
              cache_data: false,
            },
            { timeout: 20000 }
          )
          .then(
            async (response: {
              data: {
                data: any;
                analyzed_data: any;
              };
            }) => {
              const analyzedData = response?.data.analyzed_data || [];
              const web = new WebClient(bot?.token);
              const maxItemsToShow = 2;
              consoleLog.push(`\n\n[Weekly notification - openAI result ${JSON.stringify(analyzedData)}] \n\n`);
              if (analyzedData.length) {
                let analyzedInfo = '';
                let message = '';
                let textFeedback = `*Welcome to Feedback Sync's Weekly Analysis! For a deeper dive, head to your customer feedback <${process.env.APP_URL}/dashboard/library|library> and <${process.env.APP_URL}/dashboard/search|dashboard>.*\n`;
                analyzedData
                  ?.sort((a: { id: number }, b: { id: number }) => a?.id - b?.id)
                  .forEach((data: any) => {
                    const { document_ids } = data;
                    if (data?.data) {
                      data?.data.forEach((fdback: { heading: string; keywords: string[] }) => {
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

                automatic_update_channel_Id &&
                  (await web.chat
                    .postMessage({
                      channel: automatic_update_channel_Id,
                      text: textFeedback,
                    })
                    .then((response) => {
                      consoleLog.push(`\n\n[ Weekly Notification - ###SUCCESS post-msg ${response}] \n\n`);
                      consoleLog.push(`\n\n[<<<<<<<< CRON JOB End ${new Date().toLocaleString()} >>>>>>>>>] \n\n`);
                      console.info(`[CRON JOB]`, consoleLog.toString());
                    })
                    .catch((error) => {
                      consoleLog.push(`\n\n[ Weekly Notification - ### ERROR post-msg ] ${error}`);
                      consoleLog.push(`\n\n[<<<<<<<< CRON JOB End ${new Date().toLocaleString()}>>>>>>>>>]`);
                      console.error(`[CRON JOB]`, consoleLog.toString());
                    }));

                consoleLog.push(`\n\n[CRON JOB setTimeout Start] : ${new Date().toLocaleString()}`);
                await setTimeout(60000);
                consoleLog.push(`\n\n[CRON JOB setTimeout End] : ${new Date().toLocaleString()}`);
              } else if (analyzedData.length === 0 || analyzedData.length < 5) {
                automatic_update_channel_Id &&
                  (await web.chat
                    .postMessage({
                      channel: automatic_update_channel_Id,
                      text: `Whoops, there weren't enough pieces of feedback to generate an analysis this week. Now's great time to set-up new <${process.env.APP_URL}/dashboard/integrations|integrations> and keep the feedback comming.`,
                    })
                    .then((response: any) => {
                      consoleLog.push(`\n\n[Weekly Notification - ###SUCCESS post-msg no feedback ${response}] \n\n`);
                      consoleLog.push(`\n\n[<<<<<<<< CRON JOB End ${new Date().toLocaleString()} >>>>>>>>>]`);
                      console.info(`[CRON JOB]`, consoleLog.toString());
                    })
                    .catch((error) => {
                      consoleLog.push(`\n\n[Weekly Notification -  ### ERROR no feedbacks ] ${error}`);
                      consoleLog.push(`\n\n[<<<<<<<< CRON JOB End ${new Date().toLocaleString()}>>>>>>>>>]`);
                      console.error(`[CRON JOB]`, consoleLog.toString());
                    }));
              }
            }
          )
          .catch((error) => {
            console.error('\n\n[Weekly Notification - waivate api error]', error);
            consoleLog.push(`\n\n[CRON JOB - waivate api error] ${error}`);
            console.error('[CRON JOB]', consoleLog.toString());
          });
      }
    });
  }
}
