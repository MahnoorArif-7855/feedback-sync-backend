import express from 'express';
import slackChannelNotificationController from '../controllers/slackChannelNotification.controller';

const router = express.Router();

router.use('/', slackChannelNotificationController.get);

export default router;
