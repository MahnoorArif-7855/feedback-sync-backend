import { GraphQLObjectType, GraphQLString } from 'graphql';

const BlogsType = new GraphQLObjectType({
  name: 'Blogs',
  fields: () => ({
    userId: { type: GraphQLString },
    date: { type: GraphQLString },
    slug: { type: GraphQLString },
    description: { type: GraphQLString },
    title: { type: GraphQLString },
    subtitle: { type: GraphQLString },
    image_url: { type: GraphQLString },
  }),
});

export default BlogsType;
