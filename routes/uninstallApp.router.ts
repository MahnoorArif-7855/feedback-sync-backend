import express from 'express';

import uninstallController from '../controllers/uninstallApp.controller';

const router = express.Router();

router.get('/', uninstallController.get);

export default router;
