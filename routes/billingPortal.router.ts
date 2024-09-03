import express from 'express';
import billingPortalController from '../controllers/billingPortal.controller';

const router = express.Router();

router.use('/', billingPortalController.get);

export default router;
