import express from 'express';
import monitorAISearch from '../controllers/monitorAISearch.controller';

const router = express.Router();

router.use('/', monitorAISearch.get);

export default router;
