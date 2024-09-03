import express from 'express';

import discourseSecretKeyController from '../controllers/discourseSecretKey.controller';

const router = express.Router();

router.post('/', discourseSecretKeyController.get);

export default router;
