import express from 'express';
import userstypeController from '../controllers/userTypeUpdate.controller';

const router = express.Router();

router.use('/', userstypeController.get);

export default router;
