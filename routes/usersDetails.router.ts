import express from 'express';
import usersDetailsController from '../controllers/usersDetails.controller';

const router = express.Router();

router.use('/', usersDetailsController.get);

export default router;
