import express from 'express';
import paymentController from '../controllers/payment.controller';

const router = express.Router();

router.use('/create-checkout-session', paymentController.get);

export default router;
