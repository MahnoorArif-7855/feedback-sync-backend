import express from 'express';
import lastActivityController from '../controllers/lastActivity.controller';

const router = express.Router();

router.use('/', lastActivityController.get);

export default router;
