import express from 'express';
import deleteDataController from '../controllers/deleteData.controller';

const router = express.Router();

router.use('/', deleteDataController.get);

export default router;
