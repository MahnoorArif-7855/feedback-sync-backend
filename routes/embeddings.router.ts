import express from 'express';
import embeddingsController from '../controllers/embeddings.controller';

const router = express.Router();

router.post('/', embeddingsController.create);

export default router;
