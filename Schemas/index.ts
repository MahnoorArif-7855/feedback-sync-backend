import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLBoolean, GraphQLInt } from 'graphql';
import { User, Feedback, Organization, FeedbackTags, ZendeskTicketComments, Blogs } from '../database';

import UserType from './TypesDefs/UserType';
import OrganizationType from './TypesDefs/OrganizationType';
import FindFilterType from './TypesDefs/FindFilterFeedbacks';
import FeedbackTagsType from './TypesDefs/FeedbackTagsType';
import ZendeskTicketCommentsType from './TypesDefs/ZendeskTikcetComments';
import BlogsType from './TypesDefs/Blogs';
import { WebClient } from '@slack/web-api';

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    getAllUsers: {
      type: new GraphQLList(UserType),
      args: { uid: { type: GraphQLString } },
      resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }
        return User.find({ userId: args.uid });
      },
    },
    getFeedbackTags: {
      type: new GraphQLList(FeedbackTagsType),
      args: { organizationId: { type: GraphQLString } },
      resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }
        return FeedbackTags.find({ organizationId: args.organizationId });
      },
    },
    getOrganizations: {
      type: new GraphQLList(OrganizationType),
      resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }
        return Organization.find();
      },
    },
    getBlogs: {
      type: new GraphQLList(BlogsType),
      resolve(parent, args, context) {
        // if (!context.user) {
        //   throw new Error('Unauthorized');
        // }
        return Blogs.find();
      },
    },
    getBlogById: {
      type: new GraphQLList(BlogsType),
      args: {
        slug: { type: GraphQLString },
      },
      resolve(parent, args, context) {
        // if (!context.user) {
        //   throw new Error('Unauthorized');
        // }
        return Blogs.find({ slug: args.slug });
      },
    },
    findFeedbacksByOrganizationId: {
      type: new GraphQLList(FindFilterType),
      args: {
        organizationId: { type: GraphQLString },
      },
      resolve(parent, args, context) {
        try {
          return Feedback.find({
            organizationId: args.organizationId,
          });
        } catch (error) {
          // Return error message
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Error finding feedbacks',
            user: null,
          };
        }
      },
    },
    findFeedbackByUser: {
      type: new GraphQLList(FindFilterType),
      args: {
        organizationId: { type: GraphQLString },
        categories: { type: new GraphQLList(GraphQLString) },
        sources: { type: new GraphQLList(GraphQLString) },
        tags: { type: new GraphQLList(GraphQLString) },
        from: { type: GraphQLString },
        to: { type: GraphQLString },
        // Pagination arguments
        page: { type: GraphQLInt },
        perPage: { type: GraphQLInt },
      },
      async resolve(parent, args, context) {
        try {
          const feedbacks = await Feedback.find({
            organizationId: args.organizationId,
            category: args.categories,
            ...(args?.tags?.length && { tags: { $in: args.tags } }),
            ...(args?.sources?.length && {
              source: args.sources,
            }),
            date: {
              $gte: new Date(args.from).toISOString(),
              $lt: `${args.to}T23:00:00.000Z`,
            },
          })
            .sort({ date: -1 }) // Sort by date in descending order
            .skip((args?.page - 1) * args?.perPage) // Skip records based on page number
            .limit(args?.perPage); // Limit number of records per page
          return feedbacks;
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Error finding latest feedbacks',
            user: null,
          };
        }
      },
    },
    findTotalFeedbackByUser: {
      type: GraphQLInt,
      args: {
        organizationId: { type: GraphQLString },
        categories: { type: new GraphQLList(GraphQLString) },
        sources: { type: new GraphQLList(GraphQLString) },
        tags: { type: new GraphQLList(GraphQLString) },
        from: { type: GraphQLString },
        to: { type: GraphQLString },
      },
      async resolve(parent, args, context) {
        try {
          const totalFeedbacks = await Feedback.countDocuments({
            organizationId: args.organizationId,
            category: args.categories,
            ...(args.tags && args.tags.length && { tags: { $in: args.tags } }),
            ...(args.sources && args.sources.length && { source: args.sources }),
            date: {
              $gte: new Date(args.from).toISOString(),
              $lt: `${args.to}T23:00:00.000Z`,
            },
          }).exec(); // Ensure execution to return a promise

          return totalFeedbacks;
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Error finding feedback counts',
            user: null,
          };
        }
      },
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    findUserInfo: {
      type: new GraphQLList(UserType),
      args: {
        uid: { type: GraphQLString },
      },
      resolve(parent, args, context) {
        return User.aggregate([
          {
            $lookup: {
              from: 'organizations',
              localField: 'organizationId',
              foreignField: '_id',
              as: 'organizationDetails',
            },
          },
          {
            $match: {
              // Replace 'SPECIFIC_USER_ID' with the _id of the user you want to filter for
              userId: args.uid,
            },
          },
        ]).exec();
      },
    },
    findOrganizationInfo: {
      type: new GraphQLList(OrganizationType),
      args: {
        organizationId: { type: GraphQLString },
      },
      resolve(parent, args, context) {
        // if (!context.user) {
        //   throw new Error('Unauthorized');
        // }

        return Organization.find({ _id: args.organizationId });
      },
    },

    addBlog: {
      type: new GraphQLList(BlogsType),
      args: {
        userId: { type: GraphQLString },
        date: { type: GraphQLString },
        slug: { type: GraphQLString },
        subtitle: { type: GraphQLString },
        description: { type: GraphQLString },
        title: { type: GraphQLString },
        image_url: { type: GraphQLString },
      },

      resolve(parent, args, context) {
        return Blogs.create(args).then((updatedDocument) => [updatedDocument]);
      },
    },

    updateBlog: {
      type: new GraphQLList(BlogsType),
      args: {
        slug: { type: GraphQLString },
        subtitle: { type: GraphQLString },
        description: { type: GraphQLString },
        title: { type: GraphQLString },
        image_url: { type: GraphQLString },
      },

      resolve(parent, args, context) {
        return Blogs.findOneAndUpdate(
          { slug: args.slug },
          {
            $set: {
              slug: args.slug,
              subtitle: args.subtitle,
              description: args.description,
              title: args.title,
              image_url: args.image_url,
            },
          },
          { new: true, setDefaultsOnInsert: true }
        ).then((updatedDocument) => [updatedDocument]);
      },
    },
    findZendeskComments: {
      type: new GraphQLList(ZendeskTicketCommentsType),
      args: {
        feedbackId: { type: GraphQLString },
      },
      resolve(parent, args, context) {
        return ZendeskTicketComments.find({ feedbackId: args.feedbackId });
      },
    },

    findFilterFeedbacks: {
      type: new GraphQLList(FindFilterType),
      args: {
        organizationId: { type: GraphQLString },
        categories: { type: new GraphQLList(GraphQLString) },
        sources: { type: new GraphQLList(GraphQLString) },
        tags: { type: new GraphQLList(GraphQLString) },
        from: { type: GraphQLString },
        to: { type: GraphQLString },
        page: { type: GraphQLInt },
        perPage: { type: GraphQLInt },
      },
      resolve(parent, args, context) {
        try {
          return Feedback.find({
            organizationId: args.organizationId,
            category: args.categories,
            ...(args?.tags?.length && { tags: { $in: args.tags } }),
            ...(args?.sources?.length && {
              source: args.sources,
            }),
            date: {
              $gte: new Date(args.from).toISOString(),
              $lt: `${args.to}T23:00:00.000Z`,
            },
          })
            .sort({ date: -1 }) // Sort by date in descending order
            .skip((args?.page - 1) * args?.perPage) // Skip records based on page number
            .limit(args?.perPage); // Limit number of records per page
        } catch (error) {
          // Return error message
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Error finding feedbacks',
            user: null,
          };
        }
      },
    },
    filterFeedbacksByOrganizationId: {
      type: new GraphQLList(FindFilterType),
      args: {
        organizationId: { type: GraphQLString },
        categories: { type: new GraphQLList(GraphQLString) },
        sources: { type: new GraphQLList(GraphQLString) },
        tags: { type: new GraphQLList(GraphQLString) },
        from: { type: GraphQLString },
        to: { type: GraphQLString },
      },
      resolve(parent, args, context) {
        try {
          return Feedback.find({
            organizationId: args.organizationId,
            category: args.categories,
            ...(args?.tags?.length && { tags: { $in: args.tags } }),
            ...(args?.sources?.length && {
              source: args.sources,
            }),
            date: {
              $gte: new Date(args.from).toISOString(),
              $lt: `${args.to}T23:00:00.000Z`,
            },
          });
        } catch (error) {
          // Return error message
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Error finding feedbacks',
            user: null,
          };
        }
      },
    },
    feedbacksByOrganizationId: {
      type: new GraphQLList(FindFilterType),
      args: {
        organizationId: { type: GraphQLString },
      },
      resolve(parent, args, context) {
        try {
          // if (!context.user) {
          //   throw new Error('Unauthorized');
          // }
          return Feedback.find({
            organizationId: args.organizationId,
          });
        } catch (error) {
          // Return error message
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Error finding feedbacks',
            user: null,
          };
        }
      },
    },
    findTagsAndUpdate: {
      type: new GraphQLList(FeedbackTagsType),
      args: {
        organizationId: { type: GraphQLString },
        tags: { type: new GraphQLList(GraphQLString) },
      },
      resolve(parent, args, context) {
        try {
          return FeedbackTags.find({ organizationId: args.organizationId })
            .then((res) => {
              if (res[0]?.tags?.length) {
                return FeedbackTags.findOneAndUpdate(
                  { organizationId: args.organizationId },
                  { $set: { tags: args.tags } },
                  { new: true, setDefaultsOnInsert: true }
                ).then((updatedDocument) => [updatedDocument]);
              } else {
                const tagsData = {
                  organizationId: args.organizationId,
                  tags: args.tags,
                };
                return FeedbackTags.create(tagsData).then((updatedDocument) => [updatedDocument]);
              }
            })
            .catch((err) => {
              console.log('error finding tags', err);
            });
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Error finding feedback tags',
            user: null,
          };
        }
      },
    },
    updateOrganization: {
      type: new GraphQLList(OrganizationType),
      args: {
        organizationId: { type: GraphQLString },
        allowPaidPlan: { type: GraphQLBoolean },
      },
      resolve(parent, args, context) {
        try {
          return Organization.findOneAndUpdate(
            { organizationId: args.organizationId },
            { $set: { allowPaidPlan: args.allowPaidPlan } },
            { new: true, setDefaultsOnInsert: true }
          ).then((updatedDocument) => [updatedDocument]);
        } catch (error) {
          // Return error message
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Error finding organization',
            user: null,
          };
        }
      },
    },
    updateOrganizationChannelId: {
      type: new GraphQLList(OrganizationType),
      args: {
        organizationId: { type: GraphQLString },
        automatic_update_channel_Id: { type: GraphQLString },
        automatic_update_channel_name: { type: GraphQLString },
      },
      async resolve(parent, args, context) {
        try {
          return await Organization.findOne({ organizationId: args.organizationId }).then(async (existingChannel) => {
            if (existingChannel) {
              const { bot, automatic_update_channel_Id } = existingChannel || {
                bot: null,
                automatic_update_channel_Id: null,
              };
              if (bot?.token) {
                const web = new WebClient(bot?.token);
                return await web.conversations
                  .join({ channel: args.automatic_update_channel_Id })
                  .then(async (res) => {

                    // automatic_update_channel_Id may be undefined and joining the channel is unnessesary
                    if (automatic_update_channel_Id !== undefined) {
                      const membershipResult = await web.conversations.members({ channel: automatic_update_channel_Id });

                      const { members } = membershipResult || { members: [] };

                      if (members && members?.includes(bot.userId)) {
                        const leaveChannels = await web.conversations.leave({
                          channel: automatic_update_channel_Id,
                        });
                      }
                    }

                    return Organization.findOneAndUpdate(
                      { organizationId: args.organizationId },
                      {
                        $set: {
                          automatic_update_channel_Id: args.automatic_update_channel_Id,
                          automatic_update_channel_name: args.automatic_update_channel_name,
                        },
                      },
                      { new: true, setDefaultsOnInsert: true }
                    ).then(async (updatedDocument) => {
                      return [updatedDocument];
                    });
                  })
                  .catch((error) => {
                    console.log('error0909090909090909', error);
                    return error;
                  });
              }
            }
          });
        } catch (error) {
          console.log('error', error);
          return error;
        }
      },
    },
    updateOnboardingStep: {
      type: new GraphQLList(UserType),
      args: {
        userId: { type: GraphQLString },
        step: { type: GraphQLInt },
      },
      resolve(parent, args, context) {
        try {
          return User.findOneAndUpdate(
            { userId: args.userId },
            {
              $set: {
                step: args.step,
              },
            },
            { new: true, setDefaultsOnInsert: true }
          ).then((updatedDocument) => [updatedDocument]);
        } catch (error) {
          // Return error message
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Error finding user',
            user: null,
          };
        }
      },
    },
  },
});

export default new GraphQLSchema({ query: RootQuery, mutation: Mutation });
