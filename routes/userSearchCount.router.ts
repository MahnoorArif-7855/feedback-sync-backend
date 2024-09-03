import express from 'express';
import userSearchCountController from '../controllers/userSearchCount.controller';

const router = express.Router();

router.use('/', userSearchCountController.get);

export default router;
