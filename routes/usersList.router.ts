import express from 'express';
import usersListController from '../controllers/usersList.controller';

const router = express.Router();

router.use('/', usersListController.get);

export default router;
