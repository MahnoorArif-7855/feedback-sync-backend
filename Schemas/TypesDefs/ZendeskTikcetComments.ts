const graphql = require('graphql');

const { GraphQLObjectType, GraphQLString, GraphQLInt } = graphql;

const ZendeskTicketComments = new GraphQLObjectType({
  name: 'ZendeskTicketComments',
  fields: () => ({
    _id: { type: GraphQLString },
    ticketId: { type: GraphQLInt },
    feedbackId: { type: GraphQLString },
    comment: { type: GraphQLString },
  }),
});

export default ZendeskTicketComments;
