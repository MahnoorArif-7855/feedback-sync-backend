import express from 'express';
import webhookController from '../controllers/webhook.controller';

const router = express.Router();

router.use('/stripe', webhookController.stripeWebhook.get);
router.use('/zendesk/:id', webhookController.zendeskWebhook.get);
router.use('/discourse/:id', webhookController.discourseWebhook.get);
router.use('/intercom/:id', webhookController.intercomWebhook.get);

export default router;
