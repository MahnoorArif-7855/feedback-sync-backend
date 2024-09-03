import mongoose from 'mongoose';
import config from '../config';

export { default as Feedback } from './models/feedback.model';
export { default as User } from './models/user.model';
export { default as Organization } from './models/organization.model';
export { default as Billing } from './models/billing.model';
export { default as Admin } from './models/admin.modal';
export { default as FeedbackTemp } from './models/feedbackTemp.modal';
export { default as Search } from './models/search.modal';
export { default as FeedbackTags } from './models/tags.modal';
export { default as AnalysisOutputs } from './models/analysisOutput.modal';
export { default as ZendeskTicketComments } from './models/zendeskTicketComments.modal';
export { default as Blogs } from './models/blog.modal';
export { default as IntercomWebhook } from './models/intercomWebhook.model';
export { default as UnKnownApps } from './models/unKnownApps.model';

const uri = config.DB_URI;

let isConnected: boolean;
let db: typeof mongoose;

export const connectToDB = async () => {
  if (isConnected) return db;

  try {
    db = await mongoose.connect(uri ?? '');
    isConnected = !!db.connections[0].readyState;
    console.log('Connected to Mongo');
    return db;
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message);
    throw new Error('Error connecting to Mongo');
  }
};
