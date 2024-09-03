import express from 'express';

import zendeskSecretKeyController from '../controllers/zendeskSecretKey.controller';

const router = express.Router();

router.post('/', zendeskSecretKeyController.get);

export default router;
