import { GraphQLInt } from 'graphql';

const graphql = require('graphql');

const { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLScalarType, GraphQLBoolean } = graphql;

const GraphQLJSON = new GraphQLScalarType({
  name: 'JSON',
  description: 'GPT Output JSON Object',
  serialize: (value: any) => value,
  parseValue: (value: any) => value,
  parseLiteral: (ast: any) => {
    // You can implement a parseLiteral function to handle JSON literals if needed.
    // Otherwise, you can simply return null.
    return null;
  },
});

const FindFilterType = new GraphQLObjectType({
  name: 'FindfilterFeedback',
  fields: () => ({
    _id: { type: GraphQLString },
    organization: { type: GraphQLString },
    userId: { type: GraphQLString },
    date: { type: GraphQLString },
    source: { type: GraphQLString },
    channelId: { type: GraphQLString },
    feedback: { type: GraphQLString },
    discourseFeedback: { type: GraphQLString },
    category: { type: GraphQLString },
    from: { type: GraphQLString },
    to: { type: GraphQLString },
    categories: { type: new GraphQLList(GraphQLString) },
    organizationId: { type: GraphQLString },
    tags: { type: new GraphQLList(GraphQLString) },
    sources: { type: new GraphQLList(GraphQLString) },
    zendeskComment: { type: GraphQLString },
    discourseCategoryName: { type: GraphQLString },
    zendeskTags: { type: new GraphQLList(GraphQLString) },
    gptOutput: { type: GraphQLJSON },
    weaviateId: { type: GraphQLJSON },
    weaviate: { type: GraphQLBoolean },
    // Pagination arguments
    page: { type: GraphQLInt },
    perPage: { type: GraphQLInt },
  }),
});

export default FindFilterType;
