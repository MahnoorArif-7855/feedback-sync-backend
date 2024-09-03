import { Request, RequestHandler } from 'express';

import config from '../config';
import Stripe from 'stripe';
import { Billing } from '../database';

const stripeSecretKey = config.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' });

const get: RequestHandler = async (req: any, res, next) => {
  const { customerId } = req.body;
  try {
    const subscriptionpPlan = await Billing.find({ customer: customerId });
    console.log('subscriptionpPlan', subscriptionpPlan);

    const subscriptionId = subscriptionpPlan[0]?.id;
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    console.log('subscription', subscription);

    res.status(200).json(subscription);
  } catch (error) {
    console.error(`Error running userList query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
