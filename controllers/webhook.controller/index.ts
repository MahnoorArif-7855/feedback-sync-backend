import stripeWehookController from './stripe.controller';
import zendeskWebhookController from './zendesk.controller';
import discourseWebhookController from './discourse.controller';
import intercomWebhookController from './intercom.controller';

export default {
  stripeWebhook: stripeWehookController,
  zendeskWebhook: zendeskWebhookController,
  discourseWebhook: discourseWebhookController,
  intercomWebhook: intercomWebhookController,
};
