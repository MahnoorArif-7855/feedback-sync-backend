import express from 'express';
import adminController from '../controllers/admin.controller';

const router = express.Router();

router.use('/', adminController.get);

export default router;
