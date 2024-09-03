import express from 'express';
import sendSlackMessageController from '../controllers/send-slack-message.controller';

const router = express.Router();

router.use('/', sendSlackMessageController.get);

export default router;
