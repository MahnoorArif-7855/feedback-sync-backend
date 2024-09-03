import express from 'express';
import insertSlackFeedback from '../controllers/insert-slack-feedback.controller';

const router = express.Router();

router.post('/', insertSlackFeedback.get);

export default router;
