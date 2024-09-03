const graphql = require('graphql');

const { GraphQLObjectType, GraphQLString } = graphql;

const FindUserType = new GraphQLObjectType({
  name: 'FindUser',
  fields: () => ({
    name: { type: GraphQLString },
    uid: { type: GraphQLString },
    email: { type: GraphQLString },
    providerId: { type: GraphQLString },
  }),
});

export default FindUserType;
