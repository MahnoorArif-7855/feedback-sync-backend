import express from 'express';

import deletFeedbackController from '../controllers/delete-feedback.controller';

const router = express.Router();

router.get('/', deletFeedbackController.get);

export default router;
