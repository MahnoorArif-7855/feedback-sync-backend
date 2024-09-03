import express from 'express';
import slackNotificationController from '../controllers/slackNotification';

const router = express.Router();

router.get('/', slackNotificationController.get);

export default router;
