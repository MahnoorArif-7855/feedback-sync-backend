import express from 'express';
import SubscriptionController from '../controllers/subscriptionCancel.controller';


const router = express.Router();

router.use('/', SubscriptionController.get);

export default router;
