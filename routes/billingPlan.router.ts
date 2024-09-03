import express from 'express';
import billingPlanController from '../controllers/billingPlan.controller';

const router = express.Router();

router.use('/', billingPlanController.get);

export default router;
