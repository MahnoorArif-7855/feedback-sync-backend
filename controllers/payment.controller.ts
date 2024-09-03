require('dotenv').config();
import { Stripe } from 'stripe';

import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import config from '../config';

const stripeSecretKey = config.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' });
interface StripeDetails {
  customer_email?: string;
  customer?: string;
}

const get: RequestHandler = async (req: Request, res: Response, next) => {
  const { email, uid, organizations, customerId, freeTrailEnable } = req.body;

  let stripeDetails: StripeDetails = { customer_email: email };
  if (customerId) {
    stripeDetails = { customer: customerId };
  }

  let subscription_data: { trial_period_days?: number; metadata: { userId: string; organizationId: string } } = {
    metadata: {
      userId: `${uid}`,
      organizationId: `${organizations}`,
    },
  };

  if (freeTrailEnable) {
    subscription_data.trial_period_days = 14;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: config.STRIPE_PRICE_ID_PREMIUM,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${config.FRONT_END_REDIRECT_URL}/pricing`,
      cancel_url: `${config.FRONT_END_REDIRECT_URL}/dashboard/billing-plan`,

      ...stripeDetails,

      subscription_data: {
        ...subscription_data,
      },
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export default {
  get,
};
