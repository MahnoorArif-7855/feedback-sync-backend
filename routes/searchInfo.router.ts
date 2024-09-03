import express from 'express';
import searchInfoController from '../controllers/searchInfo.controller';

const router = express.Router();

router.use('/', searchInfoController.get);

export default router;
