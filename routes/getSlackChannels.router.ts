import express from 'express';
import getSlackChannelsController from '../controllers/getSlackChannels.controller';

const router = express.Router();

router.use('/', getSlackChannelsController.get);

export default router;
