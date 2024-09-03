import express from 'express';
import uploadFileController from '../controllers/uploadFile.controller';

const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use('/', uploadFileController.get, upload.single('file'));

export default router;
