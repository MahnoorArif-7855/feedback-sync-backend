require('dotenv').config();
import { Stripe } from 'stripe';

import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { Billing, Organization, User } from '../../database';
import config from '../../config';
import { WebClient } from '@slack/web-api';
import axios from 'axios';

const stripeSecretKey = config.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15',
});

const get: RequestHandler = async (req: Request, res: Response, next) => {
  const payload = req.body;

  const payloadString = JSON.stringify(payload, null, 2);
  const secret = config.STRIPE_WEBHOOK_SECRET || '';

  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret,
  });
  let event = req.body;

  const handleSubscriptionUpdate = async (customerSubscription: any) => {
    const {
      id,
      object,
      expires_at,
      customer_email,
      created,
      currency,
      cancel_url,
      billing_cycle_anchor,
      cancel_at,
      cancel_at_period_end,
      canceled_at,
      cancellation_details,
      current_period_end,
      current_period_start,
      amount_subtotal,
      amount_total,
      customer,
      invoice,
      subscription,
      mode,
      plan,
      metadata,
      quantity,
      schedule,
      start_date,
      status,
    } = customerSubscription;

    const billingDetailsStatus = {
      id: id,
      object: object,
      expires_at: expires_at,
      customer_email: customer_email,
      created: created,
      currency: currency,
      cancel_url: cancel_url,
      current_period_end: current_period_end,
      current_period_start: current_period_start,
      amount_subtotal: amount_subtotal,
      amount_total: amount_total,
      customer: customer,
      invoice: invoice,
      mode: mode,
      subscription: subscription,
      billing_cycle_anchor: billing_cycle_anchor,
      cancel_at: cancel_at,
      cancel_at_period_end: cancel_at_period_end,
      canceled_at: canceled_at,
      cancellation_details: {
        comment: cancellation_details.comment,
        feedback: cancellation_details.feedback,
        reason: cancellation_details.reason,
      },
      plan: {
        id: plan.id,
        object: plan.object,
        aggregate_usage: plan.aggregate_usage,
        amount: plan.amount,
        amount_decimal: plan.amount_decimal,
        billing_scheme: plan.billing_scheme,
        created: plan.created,
        currency: plan.currency,
        interval: plan.currency,
        interval_count: plan.interval_count,
        nickname: plan.nickname,
        product: plan.product,
        tiers_mode: plan.tiers_mode,
        transform_usage: plan.transform_usage,
        trial_period_days: plan.trial_period_days,
        usage_type: plan.usage_type,
      },
      quantity: quantity,
      schedule: schedule,
      start_date: start_date,
      status: status,
      organizationId: metadata.organizationId,
      userId: metadata.userId,
    };

    let count;
    const reSubscribe = await Billing.find({
      id: customerSubscription.id,
    });
    const freetoPremium = await Organization.find({
      organizationId: metadata.organizationId,
    });
    if (freetoPremium[0]?.plan === 'free') {
      const findConversation = async () => {
        try {
          const webhookUrl = `https://hooks.slack.com/services/${config.SLACK_INCOMING_WEBHOOK}`;
          const payload = {
            text: `🔔 New Alert! 🔔
            Hey team, we have an exciting update! Our ${freetoPremium[0]?.organizationName} has just upgraded from a free plan to premium. 🎉👋`,
          };

          axios
            .post(webhookUrl, payload, {
              headers: {
                'Content-type': 'application/json',
              },
            })
            .then((response) => {
              console.log('Message sent successfully:', response.data);
              next();
            })
            .catch((error) => {
              console.error('Error sending message:', error?.data);
              next();
            });
        } catch (error) {
          console.error(error);
          next();
        }
      };
      findConversation();
    }

    await Billing.findOneAndUpdate(
      { organizationId: metadata?.organizationId },
      { $set: billingDetailsStatus },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).then(async (resp) => {
      if (reSubscribe.length === 0) {
        count = 0;
      } else if (['canceled'].includes(customerSubscription.status)) {
        count = 0;
      } else {
        count = freetoPremium[0]?.searchCount;
      }
      console.log('reSubscribe', count);
      await Organization.findOneAndUpdate(
        { organizationId: resp?.organizationId },
        {
          $set: {
            customerId: resp?.customer,
            plan: resp?.plan.nickname,
            status: resp?.status,
            searchCount: count,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
        .then((userData) => {})
        .catch((error) => {
          console.log('error', error);
        });
    });
  };

  try {
    event = stripe.webhooks.constructEvent(payloadString, header, secret);
    console.log('event', event.type);
    res.status(200).send(`customer created successfully`);
    next();
  } catch (error: any) {
    console.log('error', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
    next(error);
  }

  if (!event) {
    res.status(400).send('Invalid event');
    next();
    return;
  }
  switch (event.type) {
    case 'customer.subscription.created':
      const customerSubscriptionCreated = event.data.object;
      // Then define and call a function to handle the event customer.subscription.created
      handleSubscriptionUpdate(customerSubscriptionCreated);
      break;
    case 'customer.subscription.updated':
      const customerSubscriptionUpdated = event.data.object;
      // Then define and call a function to handle the event customer.subscription.updated
      handleSubscriptionUpdate(customerSubscriptionUpdated);

      break;
    case 'customer.subscription.deleted':
      const customerSubscriptionDeleted = event.data.object;
      console.log('customerSubscriptionDeleted', customerSubscriptionDeleted);
      await Billing.findOneAndUpdate(
        { id: customerSubscriptionDeleted.id },
        { $set: customerSubscriptionDeleted },
        { new: true }
      ).then(async (resp) => {
        await Organization.findOneAndUpdate(
          { organizationId: resp?.organizationId }, // Query: Find a document with a specific _id
          {
            $set: {
              customerId: resp?.customer,
              status: resp?.status,
              searchCount: 0,
              plan: 'free',
            },
          }, // Update: Set the 'name' field to 'John'
          { new: true } // Options: Return the updated document
        )
          .then((userData) => {})
          .catch((error) => {});
      });
      break;

    default:
      res.redirect(`${config.FRONT_END_REDIRECT_URL}/pricing`);
  }
};

export default {
  get,
};
