import express from 'express';
import algoliaController from '../controllers/algolia.controller';

const router = express.Router();

router.post('/', algoliaController.get);

export default router;
