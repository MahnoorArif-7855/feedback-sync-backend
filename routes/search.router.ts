import express from 'express';
import searchController from '../controllers/search.controller';

const router = express.Router();

router.use('/', searchController.get);

export default router;
