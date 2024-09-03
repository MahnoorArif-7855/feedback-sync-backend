import express from 'express';
import searchCountController from '../controllers/searchCount.controller';

const router = express.Router();

router.use('/', searchCountController.get);

export default router;
