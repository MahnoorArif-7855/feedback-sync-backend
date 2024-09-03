import { model, Schema, Types } from 'mongoose';

export interface IBilling {
  id: String;
  object: String;
  organizationId: String;
  UserId: String;

  expires_at: Number;
  customer_email: String;
  created: Number;
  currency: String;
  cancel_url: String;
  billing_cycle_anchor: Number;
  cancel_at: Number;
  cancel_at_period_end: String;
  canceled_at: Number;
  cancellation_details: {
    comment: String;
    feedback: String;
    reason: String;
  };
  current_period_end: Number;
  current_period_start: Number;
  amount_subtotal: Number;
  amount_total: Number;
  customer: String;
  invoice: String;
  mode: String;
  subscription: String;
  userId: String;
  items: {
    object: String;
    data: [String];
    has_more: boolean;
    total_count: Number;
    url: String;
  };
  latest_invoice: String;
  plan: {
    id: String;
    object: String;
    active: boolean;
    aggregate_usage: String;
    amount: Number;
    amount_decimal: String;
    billing_scheme: String;
    created: Number;
    currency: String;
    interval: String;
    interval_count: Number;
    livemode: boolean;
    metadata: {};
    nickname: String;
    product: String;
    tiers_mode: String;
    transform_usage: String;
    trial_period_days: String;
    usage_type: String;
  };
  quantity: Number;
  schedule: String;
  start_date: Number;
  status: String;
}

const billingSchema = new Schema(
  {
    id: String,
    object: String,
    organizationId: String,
    UserId: String,
    expires_at: Number,
    customer_email: String,
    created: Number,
    currency: String,
    cancel_url: String,
    current_period_end: Number,
    current_period_start: Number,
    amount_subtotal: Number,
    amount_total: Number,
    customer: String,
    invoice: String,
    mode: String,
    subscription: String,
    userId: String,
    billing_cycle_anchor: Number,
    cancel_at: Number,
    cancel_at_period_end: String,
    canceled_at: Number,
    cancellation_details: {
      comment: String,
      feedback: String,
      reason: String,
    },
    plan: {
      id: String,
      object: String,
      // active: { type: boolean },
      aggregate_usage: String,
      amount: Number,
      amount_decimal: String,
      billing_scheme: String,
      created: Number,
      currency: String,
      interval: String,
      interval_count: Number,
      // livemode: boolean,
      metadata: {},
      nickname: String,
      product: String,
      tiers_mode: String,
      transform_usage: String,
      trial_period_days: String,
      usage_type: String,
    },
    quantity: Number,
    schedule: String,
    start_date: Number,
    status: String,
  }
  // { _id: false }
);

export default model<IBilling>('billings', billingSchema);
