/* eslint-disable no-console */

const cron = require('node-cron');

require('dotenv').config();
import express, { ErrorRequestHandler } from 'express';

const expressPlayground =
  // eslint-disable-next-line import/no-extraneous-dependencies
  require('graphql-playground-middleware-express').default;
import cors from 'cors';
import config from './config';
import { graphqlHTTP } from 'express-graphql';
import { connectToDB, User, Feedback, Organization } from './database';
import schema from './Schemas/index';
import { watchChangeStreams } from './database/changeStreams';
import embeddingsRouter from './routes/embeddings.router';
import chatRouter from './routes/chat.router';
import notificationRouter from './routes/slackNotification.router';
import searchRouter from './routes/search.router';
import integrationsRouter from './routes/integrations.router';
import SlackSignInRouter from './routes/slackSignIn.router';
import userDetailsRouter from './routes/userDetails.router';
import webhookRouter from './routes/webhooks.router';
import paymentRouter from './routes/payment.router';
import bodyParser from 'body-parser';
import searchInfoRouter from './routes/searchInfo.router';
import billingPortalRouter from './routes/billingPortal.router';
import billingPlanRouter from './routes/billingPlan.router';
import usersListRouter from './routes/usersList.router';
import adminRouter from './routes/admin.router';
import typeUpdateRouter from './routes/userTypeUpdate.router';
import searchCountRouter from './routes/searchCount.router';
import createTicketRouter from './routes/createTicket.router';
import subscriptionCancelRouter from './routes/subscriptionCancel.router';
import userSearchCountRouter from './routes/userSearchCount.router';
import userAccountRouter from './routes/deleteUser.router';
import usersDetailsRouter from './routes/usersDetails.router';
import uploadFileRouter from './routes/uploadFile.router';
import deleteDataController from './routes/deleteData.router';
import deleteAlgoliaDataController from './routes/deleteAlgoliaData.router';
import slackChannelsController from './routes/slackChannels.router';
import monitorAISearchRouter from './routes/monitorAISearch.controller';
import algoliaInsertRouter from './routes/algolia.router';
import feedbackInsertWebRouter from './routes/feedback-insert-web.router';
import deleteFeedbackRouter from './routes/delete-feedback.router';
import insertSlackFeedback from './routes/insert-slack-feedback.router';
import getSlackChannelsRouter from './routes/getSlackChannels.router';
import slackChannelNotificationRouter from './routes/slackChannelNotification.router';
import sendSlackMessage from './routes/send-slack-message.router';
import lastActivityRouter from './routes/last-activity.router';
import discourseRouter from './routes/discourse.router';
import zendeskSecretRouter from './routes/zendeskSecretKey.router';
import zendeskdomainRouter from './routes/zendeskDomain.router';
import intercomRouter from './routes/intercom.router';

import autoIngestChannel from './routes/auto-ingest-channel.router';
import intercomTeamAPI from './routes/intercom-teams.router';
import disconnectAppRouter from './routes/disconnectApp.router';
import uninstallAppRouter from './routes/uninstallApp.router';

import { adminMiddleware } from './utils/adminMiddleware';

import admin from 'firebase-admin';
import * as serviceAccountDev from './ServiceAccounKeyDev.json';
import * as serviceAccountProd from './ServiceAccounKeyProd.json';
import { authMiddleware } from './authMiddleware';
import { cronJobApi } from './utils/cronJob';

const PORT = config.PORT || 4000;
const app = express();
app.use(express.json());
app.use(cors({ preflightContinue: false, optionsSuccessStatus: 200 }));

app.use(authMiddleware);

const serviceAccount = config.FIREBASE_SERVICE_MODE === 'live' ? serviceAccountProd : serviceAccountDev;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});
const isDev = process.env.NODE_ENV !== 'production';

const cronTime = isDev ? '0 11 * * 5' : '0 9 * * 5'; //'0 9 * * 5'  '*/1 * * * *' '42 16 * * *'

cron.schedule(
  cronTime,
  () => {
    cronJobApi();
  },
  {
    timezone: 'America/Los_Angeles',
  }
);

app.get('/playground', expressPlayground({ endpoint: '/graphql' }));

app.use(
  '/graphql',
  graphqlHTTP((req: any) => ({
    schema: schema,
    context: req.context, // Pass the context to resolvers
    graphiql: true, // Enable GraphiQL interface for testing
  }))
);
app.use(bodyParser.raw({ type: 'application/json' }));

app.use('/embeddings', embeddingsRouter);
app.use('/chat', chatRouter);
app.use('/notification', notificationRouter);
app.use('/search', searchRouter);
app.use('/integrations', integrationsRouter);
app.use('/userInfo', SlackSignInRouter);
app.use('/userData', userDetailsRouter);
app.use('/webhooks', webhookRouter);
app.use('/stripe', paymentRouter);
app.use('/searchInfo', searchInfoRouter);
app.use('/billing-portal', billingPortalRouter);
app.use('/billing-plan', billingPlanRouter);
app.use('/searchCountUpdate', searchCountRouter);
app.use('/createTicket', createTicketRouter);
app.use('/subscription-cancel', subscriptionCancelRouter);
app.use('/user-search-count', userSearchCountRouter);
app.use('/delete-user', userAccountRouter);
app.use('/upload-file', uploadFileRouter);
app.use('/insert-data-in-algolia', algoliaInsertRouter);
app.use('/feedback-insert-web', feedbackInsertWebRouter);
app.use('/delete-data', deleteDataController);
app.use('/delete-algolia-data', deleteAlgoliaDataController);
app.use('/delete-feedback', deleteFeedbackRouter);
app.use('/slack-channels', slackChannelsController);
app.use('/insert-slack-feedback', insertSlackFeedback);
app.use('/get-slack-channels', getSlackChannelsRouter);
app.use('/slack-channel-notification', slackChannelNotificationRouter);
app.use('/send-slack-message', sendSlackMessage);
app.use('/last-activity', lastActivityRouter);
app.use('/plan-price', adminRouter);
app.use('/secret-key', discourseRouter);
app.use('/zendesk-secret-key', zendeskSecretRouter);
app.use('/set-zendesk-domain', zendeskdomainRouter);

//save intercom app id for webhook integration

app.use('/intercom-app-id', intercomRouter);

app.use('/auth-revoke', disconnectAppRouter);
app.use('/app-uninstall', uninstallAppRouter);

app.use('/auto-ingest-channel', autoIngestChannel);
app.use('/intercom-team-name', intercomTeamAPI);

// Admin routes
app.use('/users-details', adminMiddleware, usersDetailsRouter);
app.use('/usersList', adminMiddleware, usersListRouter);
app.use('/usertype', adminMiddleware, typeUpdateRouter);
app.use('/monitor-ai-search', adminMiddleware, monitorAISearchRouter);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });

  return;
};

app.use(errorHandler);

(async () => {
  try {
    await connectToDB();
    await watchChangeStreams(); // Initialize listener outside IIFE
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unable to start App', error);
    process.exit(1);
  }
})();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running : ${PORT}`);
});
