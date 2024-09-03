import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
  } from 'graphql';
  
  const FeedbackTagsType = new GraphQLObjectType({
    name: 'FeedbackTags',
    fields: () => ({
      organizationId: { type: GraphQLString },
      tags: { type: new GraphQLList(GraphQLString)},
    }),
  });
  
  export default FeedbackTagsType;
  