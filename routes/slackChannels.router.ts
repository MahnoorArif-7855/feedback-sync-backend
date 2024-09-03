import express from 'express';
import slackChannelsController from '../controllers/slackChannels.controller';

const router = express.Router();

router.use('/', slackChannelsController.get);

export default router;
