import express from 'express';

import chatController from '../controllers/chat.controller';

const router = express.Router();

router.get('/', chatController.get);

export default router;
