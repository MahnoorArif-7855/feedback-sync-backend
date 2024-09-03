import { Request, RequestHandler } from 'express';
import { Feedback, Organization, UnKnownApps } from '../database';
import axios from 'axios';
import config from '../config';
import { INTEGRATION_APP, thridPartyIntegrationList } from '../utils/thirdPartyIntegrations';
import { getSlackApiForOrganization } from '../utils/getSlackApiForOrganization';

const algoliasearch = require('algoliasearch');

const get: RequestHandler = async (req: any, res, next) => {
  const consoleLog: (string | string[])[] = [];

  try {
    const feedbackGPTAPI = config.FEEDBACK_GPT_WEAVIATE_API;

    const event = req.body.event;
    const message = req.body.message;
    const query = req.body.query || ' ';
    const organizationId = req.body.organization_id;

    console.log('\n\n event', event);

    consoleLog.push(`---->>>>>>---- SLACK AUTO INGEST START --->>>>>----`);

    consoleLog.push(`\n\n [insert slack feedback API controller]`);
    consoleLog.push(`\n \n[event] ${JSON.stringify(event)}`);
    consoleLog.push(`\n \n[organizationId] ${organizationId}`);
    consoleLog.push(`\n\n [message] ${JSON.stringify(message)}`);
    consoleLog.push(`\n\n [query] ${JSON.stringify(query)}`);

    const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
    const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME);
    const { subtype, app_id, reply_count, type } = event || {
      subtype: 'null',
      app_id: null,
      type: null,
    };
    consoleLog.push(`\n\n [subtype] ${subtype} - [type] ${type}`);
    console.log(`\n\n [subtype] ${subtype} - [type] ${type}`);

    // for subType = message_changed
    const { app_id: messageChangeAppId } = event?.message || {
      app_id: null,
    };
    const messageChangedCheckIntegratedApps = thridPartyIntegrationList.find(({ id }) => id === messageChangeAppId);
    const messageChangedIntegratedAppId = messageChangedCheckIntegratedApps?.id;

    // Look up friendly channel name
    const web = await getSlackApiForOrganization(organizationId);
    const response = await web.conversations.info({ channel: event?.channel });

    let channelName = 'Slack';
    if (response.channel && response.channel.name_normalized) {
      channelName += ` - ${response.channel.name_normalized}`;
    } else {
      console.log(`No channel found for channel ID ${event?.channel} under orgID ${organizationId}`);
    }

    console.log('messageChangeAppId', messageChangeAppId);
    console.log('messageChangedSubType', subtype);
    console.log('type', type);
    console.log('messageChangedIntegratedAppId', messageChangedIntegratedAppId);

    if (app_id && (subtype === 'bot_message' || type === 'message')) {
      const checkIntegratedApps = thridPartyIntegrationList.find(({ id }) => id === app_id);
      const integratedAppName = checkIntegratedApps?.name;
      const integratedAppId = checkIntegratedApps?.id;

      consoleLog.push(`\n[Integrated APP Name]: ${integratedAppName}`);
      consoleLog.push(`\n[Integrated APP Id]: ${integratedAppId}`);

      const getHubspotId = thridPartyIntegrationList.find(({ name }) => name === INTEGRATION_APP.HUBSPOT)?.id;
      const getIntercomId = thridPartyIntegrationList.find(({ name }) => name === INTEGRATION_APP.INTERCOM)?.id;
      const getZapierId = thridPartyIntegrationList.find(({ name }) => name === INTEGRATION_APP.ZAPIER)?.id;
      const getDeliveryFeedbackId = thridPartyIntegrationList.find(
        ({ name }) => name === INTEGRATION_APP.DELIVERY_FEEDBACK
      )?.id;
      const getIntercomConvertId = thridPartyIntegrationList.find(
        ({ name }) => name === INTEGRATION_APP.INTERCOM_CONVERT
      )?.id;
      const getFogbenderId = thridPartyIntegrationList.find(({ name }) => name === INTEGRATION_APP.FOGBENDER)?.id;
      const getJiraId = thridPartyIntegrationList.find(({ name }) => name === INTEGRATION_APP.JIRA)?.id;
      const getJiraCloudId = thridPartyIntegrationList.find(({ name }) => name === INTEGRATION_APP.JIRA_CLOUD)?.id;

      console.log('*** event ***', JSON.stringify(event));
      console.log('checkIntegratedApps', checkIntegratedApps);
      console.log('app_id', app_id);

      // Hubspot Parent Message Format -- reply_count -- is the identification
      if (checkIntegratedApps && app_id === getHubspotId && reply_count) {
        consoleLog.push(['\n------ Hubspot  Parent------\n']);

        const username = event?.username;
        const { text, attachments } = message;
        const feedback = `Title: ${text} \n\n [${username}]: ${attachments[0]?.text} \n\n Reply Back: ${attachments[0]?.fallback}`;
        const FeedbackDocument = {
          feedback: feedback,
          category: 'others',
          channelId: message?.channel,
          interestedUsers: [],
          userName: '',
          userId: event?.user,
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          mainMessageId: event?.event_ts,
        };
        consoleLog.push(`\n\n[Hubspot Feedback] ${JSON.stringify(FeedbackDocument)}`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res)}`);
              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: event?.event_ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });
        console.log(`${consoleLog.toString()} \n ----------------- \n`);

        return res.status(200).json({
          success: true,
          feedbackDataId: respFeedbackData?._id.toString(),
        });
      }
      // to handle hubspot threads
      else if (event?.thread_ts && checkIntegratedApps && app_id === getHubspotId) {
        consoleLog.push(['\n------ Hubspot  THREAD------\n']);

        const { username, text } = event;

        const feedback = await Feedback.find({
          mainMessageId: event?.thread_ts,
        });

        consoleLog.push(`\n [username]: ${username}`);
        consoleLog.push(`\n [text]: ${text}`);

        if (feedback[0]?.feedback) {
          const queryFeedback = feedback[0]?.feedback + `\n*[${username}]* ` + text;

          const FeedbackDocument = {
            feedback: queryFeedback,
            category: 'others',
            channelId: message.channel,
            interestedUsers: [],
            userName: '',
            organizationId: organizationId,
            date: Date.now(),
            interestedChannels: [],
            source: 'slack-auto-ingest',
            sourceData: { slack: event },
            tags: [],
            objectID: feedback[0]?.algoliaObjectId,
          };
          consoleLog.push(`\n [Hubspot Thread Feedback]:  ${JSON.stringify(FeedbackDocument)}\n`);

          await Feedback.findOneAndUpdate(
            {
              mainMessageId: event?.thread_ts,
            },
            { $set: FeedbackDocument },
            { new: true }
          )
            .then(async (resp: any) => {
              consoleLog.push(`\n\n[Successfully update feedback]: ${resp._id}`);

              const checkAllParameters = feedback[0]?.weaviateId && organizationId && queryFeedback;

              consoleLog.push(`\n\n[ checkAllParameters]: ${checkAllParameters}`);

              feedback[0]?.algoliaObjectId &&
                index
                  .partialUpdateObject({
                    ...FeedbackDocument,
                    objectID: feedback[0]?.algoliaObjectId,
                  })
                  .then((res: any) => {
                    consoleLog.push(`\n\n[algolia update], ${JSON.stringify(res)}`);
                  })
                  .catch((error: any) => {
                    consoleLog.push(`[algolia ERROR], ${JSON.stringify(error)}`);
                  });

              checkAllParameters &&
                (await axios
                  .post(
                    `${feedbackGPTAPI}/weaviate_utils`,
                    {
                      task: 'update_weaviate_record',
                      weaviate_uid: feedback[0]?.weaviateId,
                      organization_id: organizationId,
                      feedback: queryFeedback,
                    },
                    { timeout: 20000 }
                  )
                  .then((response) => {
                    consoleLog.push(`\n[feedback waivate response]: ${JSON.stringify(response.data)}`);
                  })
                  .catch((error) => {
                    consoleLog.push('\n[feedback waivate error', error);
                  }));
            })
            .catch((err) => {
              console.log('[ERROR]', consoleLog.toString());
              console.log('Error updating thread for Feedback', err);
            });

          console.log(`---->>>>>>---- \n ${consoleLog.toString()} \n --->>>>>----`);
          res.status(200).json({
            success: true,
            feedbackDataId: null,
            type: 'slack auto message - thread',
          });
          return;
        }
      }

      // Delivery Feedback Parent Message Format
      else if (checkIntegratedApps && app_id === getDeliveryFeedbackId) {
        consoleLog.push(['\n------ Delivery Feedback  Parent------\n']);

        const username = event?.user;
        const { text } = event;
        const feedback = `${text} \n\n `;
        const FeedbackDocument = {
          feedback: feedback,
          category: 'others',
          channelId: message?.channel,
          interestedUsers: [],
          userName: '',
          userId: event?.user,
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          mainMessageId: event?.event_ts,
        };
        consoleLog.push(`\n\n[Delivery Feedback - Feedback] ${JSON.stringify(FeedbackDocument)}`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res)}`);
              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: event?.event_ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });
        console.log(`${consoleLog.toString()} \n ----------------- \n`);

        return res.status(200).json({
          success: true,
          feedbackDataId: respFeedbackData?._id.toString(),
        });
      }

      // Zapier Parent Message Format
      else if (checkIntegratedApps && app_id === getZapierId) {
        consoleLog.push(['\n------ Zapier  Parent------\n']);

        const { text } = event;
        const feedback = `${text} \n\n `;
        const FeedbackDocument = {
          feedback: feedback,
          category: 'others',
          channelId: message?.channel,
          interestedUsers: [],
          userName: '',
          userId: event?.user,
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          mainMessageId: event?.event_ts,
        };
        consoleLog.push(`\n\n[Zapier - Feedback] ${JSON.stringify(FeedbackDocument)}`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res)}`);
              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: event?.event_ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });
        console.log(`${consoleLog.toString()} \n ----------------- \n`);

        return res.status(200).json({
          success: true,
          feedbackDataId: respFeedbackData?._id.toString(),
        });
      }

      // to handle PARENT Intercom
      else if (!event?.thread_ts && checkIntegratedApps && app_id === getIntercomId) {
        consoleLog.push(['\n------Intercom  Parent------\n']);
        const { text, channel } = event;

        const FeedbackDocument = {
          feedback: text,
          category: 'others',
          channelId: channel,
          interestedUsers: [],
          userName: '',
          userId: event?.user,
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          mainMessageId: event?.event_ts,
        };
        consoleLog.push(`\n\n[Intercom Feedback] ${JSON.stringify(FeedbackDocument)}`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res)}`);
              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: event?.event_ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });
        console.log(`${consoleLog.toString()} \n ----------------- \n`);

        return res.status(200).json({
          success: true,
          feedbackDataId: respFeedbackData?._id.toString(),
        });
      }

      // to handle THREAD Intercom
      else if (event?.thread_ts && checkIntegratedApps && app_id === getIntercomId) {
        consoleLog.push(['\n------Intercom  Thread------\n']);
        const { text, thread_ts, channel } = event;

        const feedback = await Feedback.find({
          mainMessageId: thread_ts,
        });

        consoleLog.push(`\n [text]: ${text}`);

        if (feedback[0]?.feedback) {
          const queryFeedback = feedback[0]?.feedback + `\n` + text;

          const FeedbackDocument = {
            feedback: queryFeedback,
            category: 'others',
            channelId: channel,
            interestedUsers: [],
            userName: '',
            organizationId: organizationId,
            date: Date.now(),
            interestedChannels: [],
            source: 'slack-auto-ingest',
            sourceData: { slack: event },
            tags: [],
            objectID: feedback[0]?.algoliaObjectId,
          };
          consoleLog.push(`\n [Intercom Thread Feedback]:  ${JSON.stringify(FeedbackDocument)}\n`);

          await Feedback.findOneAndUpdate(
            {
              mainMessageId: event?.thread_ts,
            },
            { $set: FeedbackDocument },
            { new: true }
          )
            .then(async (resp: any) => {
              consoleLog.push(`\n\n[Successfully update feedback]: ${resp._id}`);

              const checkAllParameters = feedback[0]?.weaviateId && organizationId && queryFeedback;

              consoleLog.push(`\n\n[ checkAllParameters]: ${checkAllParameters}`);

              feedback[0]?.algoliaObjectId &&
                index
                  .partialUpdateObject({
                    ...FeedbackDocument,
                    objectID: feedback[0]?.algoliaObjectId,
                  })
                  .then((res: any) => {
                    consoleLog.push(`\n\n[algolia update], ${JSON.stringify(res)}`);
                  })
                  .catch((error: any) => {
                    consoleLog.push(`[algolia ERROR], ${JSON.stringify(error)}`);
                  });

              checkAllParameters &&
                (await axios
                  .post(
                    `${feedbackGPTAPI}/weaviate_utils`,
                    {
                      task: 'update_weaviate_record',
                      weaviate_uid: feedback[0]?.weaviateId,
                      organization_id: organizationId,
                      feedback: queryFeedback,
                    },
                    { timeout: 20000 }
                  )
                  .then((response) => {
                    consoleLog.push(`\n[feedback waivate response]: ${JSON.stringify(response.data)}`);
                  })
                  .catch((error) => {
                    consoleLog.push('\n[feedback waivate error', error);
                  }));
            })
            .catch((err) => {
              console.log('[ERROR]', consoleLog.toString());
              console.log('Error updating thread for Feedback', err);
            });

          console.log(`---->>>>>>---- \n ${consoleLog.toString()} \n --->>>>>----`);
          res.status(200).json({
            success: true,
            feedbackDataId: null,
            type: 'slack auto message - thread',
          });
          return;
        }
      }

      // to handle Parent Intercom convert
      else if (checkIntegratedApps && app_id === getIntercomConvertId) {
        consoleLog.push(['\n------Intercom Convert  Parent------\n']);
        const { channel, username, attachments } = event;

        const pretext = attachments[0]?.pretext || '';
        const text = attachments[0]?.text || '';
        const fallback = attachments[0]?.fallback || [];

        const feedback = `*${username}*: ${pretext} \n\n [${fallback}]: ${text} `;

        const FeedbackDocument = {
          feedback: feedback,
          category: 'others',
          channelId: channel,
          interestedUsers: [],
          userName: username,
          userId: event?.user || '',
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [channelName],
          mainMessageId: event?.event_ts,
        };
        consoleLog.push(`\n\n[Intercom Feedback] ${JSON.stringify(FeedbackDocument)}`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res)}`);
              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: event?.event_ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });
        console.log(`${consoleLog.toString()} \n ----------------- \n`);

        return res.status(200).json({
          success: true,
          feedbackDataId: respFeedbackData?._id.toString(),
        });
      }

      // to handle Parent Fogbender
      else if (checkIntegratedApps && app_id === getFogbenderId && reply_count) {
        consoleLog.push(`\n -------------- FOGBENDER PARENT -------------- \n`);

        const { blocks } = event;
        let feedback = '';

        blocks.forEach(({ text }: { text: any }) => {
          feedback = feedback + '\n' + text.text;
        });
        consoleLog.push('\n [FOGBENDER feedback text]', feedback);

        const FeedbackDocument = {
          feedback: feedback,
          category: 'others',
          channelId: message?.channel,
          interestedUsers: [],
          userName: '',
          userId: event?.user,
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          mainMessageId: event?.event_ts,
        };
        consoleLog.push(`\n [FOGBENDER FeedbackDocument] :  ${FeedbackDocument}\n`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res)}`);
              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: event?.event_ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });

        const responseFogbender = { success: true, feedbackDataId: respFeedbackData?._id.toString() };

        consoleLog.push(`\n ${JSON.stringify(responseFogbender)} \n`);
        console.log(`\n \n ${consoleLog.toString()}  \n  FOGBENDER ENDS  ----------------- \n`);

        return res.status(200).json({ ...responseFogbender });
      }
      // to handle THREAD Fogbender
      else if (event?.thread_ts && checkIntegratedApps && app_id === getFogbenderId) {
        consoleLog.push(['\n------ FOGBENDER THREAD------\n']);

        const { username, text } = event;

        const feedback = await Feedback.find({
          mainMessageId: event?.thread_ts,
        });

        consoleLog.push(`\n [username]: ${username}`);
        consoleLog.push(`\n [FOGBENDER Thread text]: ${text}`);

        if (feedback[0]?.feedback) {
          const queryFeedback = feedback[0]?.feedback + `\n *[${username}]* ` + text;

          const FeedbackDocument = {
            feedback: queryFeedback,
            category: 'others',
            channelId: message.channel,
            interestedUsers: [],
            userName: '',
            organizationId: organizationId,
            date: Date.now(),
            interestedChannels: [],
            source: 'slack-auto-ingest',
            sourceData: { slack: event },
            tags: [],
            objectID: feedback[0]?.algoliaObjectId,
          };
          consoleLog.push(`\n [FOGBENDER Thread FeedbackDocument] :  ${JSON.stringify(FeedbackDocument)}\n`);

          await Feedback.findOneAndUpdate(
            {
              mainMessageId: event?.thread_ts,
            },
            { $set: FeedbackDocument },
            { new: true }
          )
            .then(async (resp: any) => {
              consoleLog.push(`\n\n[Successfully update feedback]: ${resp._id}`);

              const checkAllParameters = feedback[0]?.weaviateId && organizationId && queryFeedback;

              consoleLog.push(`\n\n[ checkAllParameters]: ${checkAllParameters}`);

              feedback[0]?.algoliaObjectId &&
                index
                  .partialUpdateObject({
                    ...FeedbackDocument,
                    objectID: feedback[0]?.algoliaObjectId,
                  })
                  .then((res: any) => {
                    consoleLog.push(`\n\n[algolia update], ${JSON.stringify(res)}`);
                  })
                  .catch((error: any) => {
                    consoleLog.push(`[algolia ERROR], ${JSON.stringify(error)}`);
                  });

              checkAllParameters &&
                (await axios
                  .post(
                    `${feedbackGPTAPI}/weaviate_utils`,
                    {
                      task: 'update_weaviate_record',
                      weaviate_uid: feedback[0]?.weaviateId,
                      organization_id: organizationId,
                      feedback: queryFeedback,
                    },
                    { timeout: 20000 }
                  )
                  .then((response) => {
                    consoleLog.push(`\n[feedback waivate response]: ${JSON.stringify(response.data)}`);
                  })
                  .catch((error) => {
                    consoleLog.push('\n[feedback waivate error', error);
                  }));
            })
            .catch((err) => {
              console.log('[ERROR]', consoleLog.toString());
              console.log('Error updating thread for Feedback', err);
            });

          console.log(`\n ${consoleLog.toString()} \n  `);
          res.status(200).json({
            success: true,
            feedbackDataId: null,
            type: 'slack auto message - thread',
          });
          return;
        }
      }
      // to handle Parent JIRA
      else if (checkIntegratedApps && app_id === getJiraId) {
        consoleLog.push(`\n -------------- JIRA PARENT -------------- \n`);

        const { attachments } = event;
        const attachmentData = attachments[0];
        let feedback = `*${attachmentData.title || ' '}* \n  ${attachmentData.fallback || ''} `;

        consoleLog.push('\n [JIRA feedback text]', feedback);

        const FeedbackDocument = {
          feedback: feedback,
          category: 'others',
          channelId: message?.channel,
          interestedUsers: [],
          userName: '',
          userId: event?.user,
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          mainMessageId: event?.event_ts,
        };
        consoleLog.push(`\n [JIRA FeedbackDocument] :  ${JSON.stringify(FeedbackDocument)}\n`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res)}`);
              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: event?.event_ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });

        const responseJira = { success: true, feedbackDataId: respFeedbackData?._id.toString() };

        consoleLog.push(`\n ${JSON.stringify(responseJira)} \n`);
        console.log(`\n \n ${consoleLog.toString()}  \n  FOGBENDER ENDS  ----------------- \n`);

        return res.status(200).json({ ...responseJira });
      }
      // to handle Parent JIRA Cloud
      else if (checkIntegratedApps && app_id === getJiraCloudId) {
        consoleLog.push(`\n -------------- JIRA Cloud PARENT -------------- \n`);

        const { blocks } = event;
        let feedback = '';

        const textBloack = blocks.filter(({ type }: { type: any }) => type === 'section');
        textBloack.forEach(({ text }: { text: any }) => {
          feedback = feedback + '\n' + text.text;
        });

        consoleLog.push('\n [JIRA feedback text]', feedback);

        const FeedbackDocument = {
          feedback: feedback,
          category: 'others',
          channelId: message?.channel,
          interestedUsers: [],
          userName: '',
          userId: event?.user,
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          mainMessageId: event?.event_ts,
        };
        consoleLog.push(`\n [JIRA FeedbackDocument] :  ${JSON.stringify(FeedbackDocument)}\n`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res)}`);
              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: event?.event_ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });

        const responseJiraCloud = { success: true, feedbackDataId: respFeedbackData?._id.toString() };

        consoleLog.push(`\n ${JSON.stringify(responseJiraCloud)} \n`);
        console.log(`\n \n ${consoleLog.toString()}  \n  JIRA CLOUD ENDS  ----------------- \n`);

        return res.status(200).json({ ...responseJiraCloud });
      }

      // when no 3rd party integration is being found
      else {
        console.log('[ERROR SLACK AUTO INGEST]  NO 3rd party app is config.', consoleLog.toString());

        console.error(
          `\n\n [ERROR SLACK AUTO INGEST]  NO 3rd party app is config. 
          \n \n[organizationId] ${organizationId}
          \n\n  [event] ${JSON.stringify(event)}
          \n\n [query] ${JSON.stringify(query)} 
          \n\n [message] ${JSON.stringify(message)}\n\n `
        );
        console.error('\n\n [ERROR SLACK AUTO INGEST]  NO 3rd party app is config.', consoleLog.toString());
        await UnKnownApps.create(event).then(async (resp: any) => {
          const web = await getSlackApiForOrganization(process.env.SLACK_WORKSPACE_ID || '');
          web &&
            (await web.chat.postMessage({
              channel: process.env.SLACK_CHANNEL_ID || '',
              text: `unknown Slack app has been integrated: ${app_id}`,
            }));
        });
        return res.status(400).json({
          success: false,
          feedbackDataId: null,
          type: 'slack-auto-ingest',
        });
      }
    }

    // handle Intercom-Convert Message Changed Thread
    else if (
      messageChangeAppId === messageChangedIntegratedAppId &&
      messageChangeAppId &&
      messageChangedIntegratedAppId &&
      subtype === 'message_changed' &&
      type === 'message'
    ) {
      console.log('--------------->>>>>>>>>>-------------------');
      const { channel } = event;
      const { thread_ts, ts, attachments, username } = event?.message || {
        thread_ts: null,
        attachments: [],
        username: '',
        ts: null,
      };
      consoleLog.push(`thread_ts  ${thread_ts}`);
      consoleLog.push(`ts  ${ts}`);

      // check for existing parent message
      let feedback: string | any[] = [];

      if (thread_ts) {
        feedback = await Feedback.find({
          mainMessageId: thread_ts,
        });
      } else {
        feedback = await Feedback.find({
          mainMessageId: ts,
        });
      }

      let queryFeedback = `*${username}*`;
      attachments.map(({ text, fallback, pretext }: { text: any; fallback: any; pretext: any }) => {
        queryFeedback =
          queryFeedback + `\n` + `\n ${pretext || ''} \n  [${fallback}]: ${text} \n ______________________`;
      });
      consoleLog.push(`feedback =========== ${feedback.length}`);

      if (feedback.length > 0) {
        const FeedbackDocument = {
          feedback: queryFeedback,
          category: 'others',
          channelId: channel,
          interestedUsers: [],
          userName: username,
          userId: '',
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          objectID: feedback[0]?.algoliaObjectId,
        };

        consoleLog.push(
          '\n\n[Intercom-Convert Message Changed Thread  FeedbackDocument]',
          JSON.stringify(FeedbackDocument)
        );

        await Feedback.findOneAndUpdate(
          {
            mainMessageId: thread_ts || ts,
          },
          { $set: FeedbackDocument },
          { new: true }
        )
          .then(async (resp: any) => {
            consoleLog.push('\n\n[Intercom Message Changed Thread Update in MongoDB]', resp._id);
            index
              .partialUpdateObject({
                ...FeedbackDocument,
                objectID: feedback[0]?.algoliaObjectId,
              })
              .then((res: any) => {
                consoleLog.push('\n\n[Update in algolia Intercom Message Changed Thread]', res._id);
              })
              .catch((error: any) => {
                console.error(
                  '\n\n[Update algolia ERROR Intercom Message Changed Thread]',
                  error,
                  consoleLog.toString()
                );
              });

            feedback[0]?.weaviateId &&
              organizationId &&
              (await axios
                .post(
                  `${feedbackGPTAPI}/weaviate_utils`,
                  {
                    task: 'update_weaviate_record',
                    weaviate_uid: feedback[0]?.weaviateId,
                    organization_id: organizationId,
                    feedback: queryFeedback,
                  },
                  { timeout: 20000 }
                )
                .then((response) => {
                  consoleLog.push(
                    '\n\n[Update in Weaviate Intercom Message Changed Thread]',
                    JSON.stringify(response.data)
                  );
                  console.log('feedback waivate response \n\n', response.data);
                })
                .catch((error) => {
                  consoleLog.push(
                    '\n\n[Update in Weaviate ERROR Intercom Message Changed Thread]',
                    JSON.stringify(error)
                  );

                  console.error(
                    `[THREAD Update in Weaviate ERROR Intercom Message Changed Thread] \n\n
                    ${error}`,
                    consoleLog.toString()
                  );
                }));
          })
          .catch((err: any) => {
            consoleLog.push('\n\n[THREAD Update in Feedback MONGO ERROR]', JSON.stringify(err));

            console.error(`Error updating thread for Feedback\n\n ${err} \n\n`, consoleLog.toString());
          });

        consoleLog.push(['\n------ Intercom-Convert Message Changed ThreadK MESSAGE END ------\n']);

        console.log(`\n ${consoleLog.toString()} \n  `);

        return res.status(200).json({
          success: true,
          feedbackDataId: null,
          type: 'slack auto message - Intercom-Convert Message Changed Thread',
        });
      }
      // Parent Message not found - Create a new doc
      else {
        const FeedbackDocument = {
          feedback: queryFeedback,
          category: 'others',
          channelId: channel,
          interestedUsers: [],
          userName: username,
          userId: '',
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          mainMessageId: ts,
        };
        consoleLog.push(`\n\n[Intercom-Convert Message Changed Feedback] ${JSON.stringify(FeedbackDocument)}`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res)}`);
              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });
        console.log(`${consoleLog.toString()} \n ----------------- \n`);

        return res.status(200).json({
          success: true,
          feedbackDataId: respFeedbackData?._id.toString(),
        });
      }
    }

    //ELSE
    else {
      // PARENT DIRECT SLACK INGEST
      if (type == 'message' && !event?.thread_ts && !subtype) {
        consoleLog.push(['\n------ DIRECT SLACK MESSAGE ------']);

        const web = await getSlackApiForOrganization(organizationId);

        const user = await web.users
          .info({ user: event?.user })
          .then((userInfoResponse) => {
            return userInfoResponse.user;
          })
          .catch((err) => console.error(`\n\n DIRECT SLACK MESSAGE ERROR ${err}`));

        const userMessageName = `[${user?.name || 'Thread'}]`;

        const FeedbackDocument = {
          feedback: `${userMessageName} ${query}`,
          category: 'others',
          channelId: message?.channel,
          interestedUsers: [],
          userName: '',
          userId: event?.user,
          organizationId: event?.team,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          mainMessageId: event?.event_ts,
        };
        consoleLog.push(`\n\n [ Parent Direct Mesage FeedbackDocument]  ${JSON.stringify(FeedbackDocument)}`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res?.objectID)}`);

              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: event?.event_ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });

        consoleLog.push('\n\n [Parent Direct Mesage respFeedbackData]', respFeedbackData?._id.toString());
        consoleLog.push(['\n------ DIRECT SLACK MESSAGE END ------\n']);

        console.log(`\n ${consoleLog.toString()} \n  `);

        return res.status(200).json({
          success: true,
          feedbackDataId: respFeedbackData?._id.toString(),
        });
      }
      // DIRECT SLACK THREAD
      else if (type === 'message' && event?.thread_ts && !subtype) {
        consoleLog.push(['\n------ DIRECT THREAD SLACK MESSAGE  ------\n']);

        const feedback = await Feedback.find({
          mainMessageId: event?.thread_ts,
        });

        const web = await getSlackApiForOrganization(organizationId);

        const user = await web.users
          .info({ user: event?.user })
          .then((userInfoResponse) => {
            return userInfoResponse.user;
          })
          .catch((err) => console.log('\n\n[ERROR in fetching user slack info details]', err.data));

        const userMessageName = `*[${user?.name || 'Thread'}]*`;

        consoleLog.push(`feedback ${feedback}`);

        if (feedback[0]?.feedback) {
          const existingMainMessageId = feedback[0]?.feedback || ' ';
          const queryFeedback = existingMainMessageId + `\n  ${userMessageName} ` + query;

          const FeedbackDocument = {
            feedback: queryFeedback,
            category: 'others',
            channelId: message.channel,
            interestedUsers: [],
            userName: '',
            organizationId: organizationId,
            date: Date.now(),
            interestedChannels: [],
            source: 'slack-auto-ingest',
            sourceData: { slack: event },
            tags: [],
            objectID: feedback[0]?.algoliaObjectId,
          };

          consoleLog.push('\n\n[Thread Direct Mesage  FeedbackDocument]', JSON.stringify(FeedbackDocument));

          await Feedback.findOneAndUpdate(
            {
              mainMessageId: event?.thread_ts,
            },
            { $set: FeedbackDocument },
            { new: true }
          )
            .then(async (resp: any) => {
              consoleLog.push('\n\n[THREAD Update in MongoDB]', resp._id);
              index
                .partialUpdateObject({
                  ...FeedbackDocument,
                  objectID: feedback[0]?.algoliaObjectId,
                })
                .then((res: any) => {
                  consoleLog.push('\n\n[Update in algolia]', res._id);
                })
                .catch((error: any) => {
                  console.error('\n\n[Update algolia ERROR]', error, consoleLog.toString());
                });

              feedback[0]?.weaviateId &&
                organizationId &&
                (await axios
                  .post(
                    `${feedbackGPTAPI}/weaviate_utils`,
                    {
                      task: 'update_weaviate_record',
                      weaviate_uid: feedback[0]?.weaviateId,
                      organization_id: organizationId,
                      feedback: queryFeedback,
                    },
                    { timeout: 20000 }
                  )
                  .then((response) => {
                    consoleLog.push('\n\n[Update in Weaviate]', JSON.stringify(response.data));
                    console.log('\n\nfeedback waivate response', response.data);
                  })
                  .catch((error) => {
                    consoleLog.push('\n\n[Update in Weaviate ERROR]', JSON.stringify(error));

                    console.error('\n\n[THREAD Update in Weaviate ERROR]', error, consoleLog.toString());
                  }));
            })
            .catch((err: any) => {
              consoleLog.push('\n\n[THREAD Update in Feedback MONGO ERROR]', JSON.stringify(err));

              console.error('\n\nError updating thread for Feedback', err, consoleLog.toString());
            });

          consoleLog.push(['\n------ DIRECT THREAD SLACK MESSAGE END ------\n']);

          console.log(`\n ${consoleLog.toString()} \n  `);

          return res.status(200).json({
            success: true,
            feedbackDataId: null,
            type: 'slack auto message - thread',
          });
        } else {
          consoleLog.push('\n\n Parent Feedback Document', JSON.stringify(feedback));
          consoleLog.push('\n\n Event Blocks', JSON.stringify(event.blocks));

          console.error('\n\n[ERROR SLACK AUTO INGEST] No Parent Document Founded ', consoleLog.toString());

          return res.status(400).json({
            success: false,
            feedbackDataId: null,
            type: 'slack-auto-ingest',
          });
        }
      }

      // when no 3rd party integration is being found
      else {
        console.error(
          `[ERROR SLACK AUTO INGEST]  NO 3rd party app is config IN ELSE STATEMENTS.
            \n \n[organizationId] ${organizationId}
             \n\n  [event] ${JSON.stringify(event)}
              \n\n [query] ${JSON.stringify(query)}
              \n\n [message] ${JSON.stringify(message)} `
        );
        console.error(
          '[ERROR SLACK AUTO INGEST]  NO 3rd party app is config IN ELSE STATEMENTS.',
          consoleLog.toString()
        );
        const { channel } = event as any;
        const { thread_ts, ts, attachments, username } = (event?.message as any) || {
          thread_ts: null,
          attachments: [],
          username: '',
          ts: null,
        };
        consoleLog.push(`thread_ts  ${thread_ts}`);
        consoleLog.push(`ts  ${ts}`);

        let queryFeedback = '';

        attachments.map(({ text, fallback, pretext }: { text: any; fallback: any; pretext: any }) => {
          queryFeedback = ` [${fallback}]: ${text} \n ______________________`;
        });
        const FeedbackDocument = {
          feedback: queryFeedback,
          category: 'others',
          channelId: message?.channel,
          interestedUsers: [],
          userName: '',
          userId: event?.user,
          organizationId: organizationId,
          date: Date.now(),
          interestedChannels: [],
          source: 'slack-auto-ingest',
          sourceData: { slack: event },
          tags: [],
          mainMessageId: event?.event_ts,
          unKnownAppId: true,
        };
        consoleLog.push(`\n\n[no 3rd party Feedback] ${JSON.stringify(FeedbackDocument)}`);

        const respFeedbackData = await Feedback.create(FeedbackDocument).then((resp: any) => {
          consoleLog.push('\n\n[Save in MongoDB]', resp._id);
          index
            .saveObject(resp, { autoGenerateObjectIDIfNotExist: true })
            .wait()
            .then(async (res: any) => {
              consoleLog.push(`\n\n [Save in Algolia] ${JSON.stringify(res)}`);
              res &&
                (await Feedback.findOneAndUpdate(
                  {
                    mainMessageId: event?.event_ts,
                  },
                  { $set: { algoliaObjectId: res?.objectID } },
                  { new: true }
                ));
            });
          return resp;
        });
        console.log(`${consoleLog.toString()} \n ----------------- \n`);

        await UnKnownApps.create(event).then(async (resp: any) => {
          const web = await getSlackApiForOrganization(process.env.SLACK_WORKSPACE_ID || '');
          web &&
            (await web.chat.postMessage({
              channel: process.env.SLACK_CHANNEL_ID || '',
              text: `unknown Slack app has been integrated: ${app_id}`,
            }));
        });

        return res.status(400).json({
          success: false,
          feedbackDataId: null,
          type: 'slack-auto-ingest',
        });
      }
    }
  } catch (error: any) {
    console.log('\n\n[ERROR]', consoleLog.toString());
    console.error('\n\n[ERROR]', consoleLog.toString());
    console.error(`\n\n[ERROR SLACK AUTO INGEST] ${error}`);
    next(error);
  }
};

export default {
  get,
};
