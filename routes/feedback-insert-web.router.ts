import express from 'express';
import feedbackInsertWebController from '../controllers/feedback-insert-web.controller';

const router = express.Router();

router.post('/', feedbackInsertWebController.get);

export default router;
