import express from 'express';
import userDetailsController from '../controllers/userDetails.controller';

const router = express.Router();

router.use('/', userDetailsController.get);

export default router;
