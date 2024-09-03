import { GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList, GraphQLBoolean, GraphQLSchema } from 'graphql';

const OrganizationType = new GraphQLObjectType({
  name: 'Organization',
  fields: () => ({
    id: { type: GraphQLInt },
    organizationName: { type: GraphQLString },
    organizationId: { type: GraphQLString },
    customerId: { type: GraphQLString },
    searchCount: { type: GraphQLInt },
    plan: { type: GraphQLString },
    status: { type: GraphQLString },
    userId: { type: GraphQLString },
    appStatus: { type: GraphQLString },
    appInstallation: { type: GraphQLBoolean },
    allowPaidPlan: { type: GraphQLBoolean },
    automatic_update_channel_Id: { type: GraphQLString },
    automatic_update_channel_name: { type: GraphQLString },
    cron_job_time: { type: GraphQLString },
    discourseSecretKey: { type: GraphQLString },
    zendeskSecretKey: { type: GraphQLString },
    intercomAppId: { type: GraphQLString },
    intercomAccessToken: { type: GraphQLString },
    zendeskSubDomain: { type: GraphQLString },
    zendeskAPIToken: { type: GraphQLString },
    zendeskEmail: { type: GraphQLString },
    newOrgBilling: { type: GraphQLBoolean },
  }),
});

export default OrganizationType;
