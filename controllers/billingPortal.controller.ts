require('dotenv').config();
import { Stripe } from 'stripe';

import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import config from '../config';

const stripeSecretKey = config.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' });

const get: RequestHandler = async (req: Request, res: Response, next) => {
  try {
    const { customerId } = req.body;
    // Create a customer or retrieve the existing customer from your database
    console.log('customerId', customerId);

    // Generate a session for the billing portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${config.FRONT_END_REDIRECT_URL}/pricing`,
    });

    // Redirect the user to the billing portal URL
    res.status(200).json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error_while_create_session: { message: error.message } });
  }
};

export default {
  get,
};
