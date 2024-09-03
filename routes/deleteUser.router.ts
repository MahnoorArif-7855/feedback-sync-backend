import express from 'express';

import settingController from '../controllers/deleteAccount.controller';

const router = express.Router();

router.get('/', settingController.get);

export default router;
