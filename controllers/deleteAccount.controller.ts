import axios, { AxiosRequestConfig } from 'axios';
import { Request, RequestHandler } from 'express';
import admin from 'firebase-admin';
import { User, Billing, Organization } from '../database';
import { Stripe } from 'stripe';

import config from '../config';

const stripeSecretKey = config.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15',
});

const get: RequestHandler = async (req: any, res, next) => {
  const uid = req.query.uid as string;
  const customerId = req.query.customerId as string;
  const organizationId = req.query.organizationId as string;
  console.log('uid', uid, organizationId, customerId);

  try {
    await User.deleteOne({ userId: uid }).then(async (userAccount: any) => {
      Billing.deleteOne({ userId: uid }).then(
        async (userBillingAccount: any) => {
          await admin
            .auth()
            .deleteUser(uid)
            .then(async () => {
              if (['undefined', 'null'].includes(customerId)) {
                console.log('Successfully deleted user');
                res.status(200).json({ delete: true });
              } else {
                console.log('customerId', customerId);
                await Organization.findOneAndUpdate(
                  { organizationId: organizationId }, // Query: Find a document with a specific userId
                  {
                    $set: {
                      customerId: null,
                      plan: 'free',
                      status: 'active',
                      searchCount: 0,
                    },
                  },
                  { new: true } // Options: Return the updated document
                );
                const deleted = await stripe.customers.del(customerId);
                console.log('deleted', deleted);
                res.status(200).json({ delete: true });
              }
            })
            .catch((error) => {
              console.log('Error deleting user:', error);
            });
        }
      );
    });
  } catch (error) {
    console.error(`Error running delete query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
