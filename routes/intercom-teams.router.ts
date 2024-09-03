import express from 'express';
import intercomTeams from '../controllers/intercom-teams.controller copy';

const router = express.Router();

router.use('/', intercomTeams.get);

export default router;
