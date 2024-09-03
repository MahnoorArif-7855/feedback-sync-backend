import {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
} from 'graphql';
import OrganizationType from './OrganizationType';

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLInt },
    userId: { type: GraphQLString },
    organizationId: { type: GraphQLString },
    userName: { type: GraphQLString },
    email: { type: GraphQLString },
    type: { type: GraphQLString },
    search_limit_user_only: { type: GraphQLBoolean },
    userSearchCount: { type: GraphQLInt },
    step: { type: GraphQLInt },
    organizationDetails: { type: new GraphQLList(OrganizationType) },
  }),
});

export default UserType;
