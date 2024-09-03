import express from 'express';

import intercomController from '../controllers/intercom.controller';

const router = express.Router();

router.post('/', intercomController.get);

export default router;
