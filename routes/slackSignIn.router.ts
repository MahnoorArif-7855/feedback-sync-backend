import express from 'express';
import slackSignInController from '../controllers/slackSignIn.controller';

const router = express.Router();

router.use('/', slackSignInController.get);

export default router;
