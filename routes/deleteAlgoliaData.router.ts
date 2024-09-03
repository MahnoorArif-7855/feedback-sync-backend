import express from 'express';
import deleteAlgoliaDataController from '../controllers/deleteAlgoliaData.controller';

const router = express.Router();

router.use('/', deleteAlgoliaDataController.get);

export default router;
