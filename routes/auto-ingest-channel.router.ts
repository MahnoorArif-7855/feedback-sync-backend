import express from 'express';
import autoIngestChannel from '../controllers/auto-ingest-channel.controller';

const router = express.Router();

router.use('/', autoIngestChannel.get);

export default router;
