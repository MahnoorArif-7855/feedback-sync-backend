import { model, Schema, Types } from 'mongoose';

export interface IOrganization {
  _id: String;
  organizationName: String;

  organizationId: String;
  enterprise?: { id: string; name: string };
  customerId: string;
  plan: string;
  searchCount: Number;
  status: string;
  tokenType: string;
  isEnterpriseInstall: boolean;
  appId: string;
  authVersion: string;
  appInstallation: boolean;
  zendeskSubDomain: string;
  zendeskSecretKey: string;
  intercomAppId: string;
  intercomAccessToken: string;
  zendeskAPIToken: string;
  zendeskEmail: string;
  newOrgBilling: boolean;
  bot: {
    scopes: string[];
    token: string;
    refreshToken: string;
    expiresAt: number;
    userId: string;
    id: string;
  };
  allowPaidPlan: boolean;
  automatic_update_channel_Id: string;
  automatic_update_channel_name: string;
  cron_job_time: string;
  discourseSecretKey: string;

  // future ref
  // users: Types.ObjectId[];
  // integrations: {
  //   zendesk?: {
  //     email: string;
  //     organizationId: string;
  //     token: string;
  //   };
  //   g2?: {
  //     slug: string;
  //   };
  // };
}

const organizationSchema = new Schema(
  {
    _id: String,
    organizationName: String,
    enterprise: { id: String, name: String },
    customerId: String,
    plan: String,
    searchCount: Number,
    status: String,
    organizationId: String,
    tokenType: String,
    isEnterpriseInstall: Boolean,
    appId: String,
    authVersion: String,
    appInstallation: Boolean,
    zendeskSubDomain: String,
    zendeskSecretKey: String,
    intercomAppId: String,
    intercomAccessToken: String,
    zendeskAPIToken: String,
    zendeskEmail: String,
    newOrgBilling: Boolean,
    bot: {
      scopes: [String],
      token: String,
      expiresAt: Number,
      refreshToken: String,
      userId: String,
      id: String,
    },
    allowPaidPlan: Boolean,
    automatic_update_channel_Id: String,
    automatic_update_channel_name: String,
    cron_job_time: String,
    discourseSecretKey: String,
  },
  { _id: false }
);

export default model<IOrganization>('organizations', organizationSchema);
