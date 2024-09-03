import express from 'express';

import disconnectController from '../controllers/disconnectApp.controller';

const router = express.Router();

router.get('/', disconnectController.get);

export default router;
