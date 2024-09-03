import mongoose, { model, Schema, Types } from 'mongoose';
import { CSVReviews, discoursePayload, G2Review, SlackAutoIngestPayload, ZendeskReview } from '../../types';

export enum SourceEnum {
  Slack = 'slack',
  Zendesk = 'zendesk',
  G2 = 'g2',
  CSV = 'csv',
  SlackAutoIngest = 'slack-auto-ingest',
  Web = 'web',
  Intercom = 'intercom',
  discourse = 'discourse',
}

export interface IFeedback {
  // _id: string;
  feedback: string;
  category: string;
  organization: string;
  customerId: string;
  channelId: string;
  organizationId: string;
  date: Date;
  userId: string;
  userName: string;
  discourseTopicId: Number;
  intercomTopicId: Number;
  discourseCategoryName: string;
  discourseFeedback: string;
  unKnownAppId: boolean;
  interestedUsers: Types.Array<{
    id: string;
    displayName: string;
    name: string;
    channelName: string;
  }>;
  userData: {
    id: string;
    username: string;
    name: string;
    team_id: string;
  };
  interestedChannels: {
    channelID: string;
    channelName: string;
  };
  zendeskComment: string | null;
  tags: Types.Array<string>;
  source: SourceEnum;
  sourceData: {
    zendesk?: ZendeskReview;
    g2?: G2Review;
    csv?: CSVReviews;
    discourse?: discoursePayload;
    slack?: SlackAutoIngestPayload;
  };
  gptOutput: {
    sentiment: string | null;
    mainTopics: string | null;
    reason: string | null;
    churn: string | null;
  };
  mainMessageId: string | null;
  algoliaObjectId: string | null;
  weaviateId?: string;
  weaviate?: boolean;
}

const feedbackSchema = new Schema<IFeedback>({
  // _id: String,
  feedback: String,
  category: String,
  organization: String,
  channelId: String,
  customerId: String,
  date: Date,
  userId: String,
  organizationId: String,
  userName: String,
  weaviateId: String,
  weaviate: Boolean,
  discourseTopicId: Number,
  intercomTopicId: Number,
  discourseCategoryName: String,
  unKnownAppId: Boolean,

  interestedUsers: [{ id: String, displayName: String, name: String, channelName: String }],
  userData: {
    id: String,
    username: String,
    name: String,
    team_id: String,
  },
  interestedChannels: {
    channelID: String,
    channelName: String,
  },
  tags: [String],
  source: { type: String, enum: SourceEnum },
  gptOutput: {
    sentiment: String,
    mainTopics: String,
    reason: String,
    churn: String,
  },
  zendeskComment: String,
  mainMessageId: String || null,
  algoliaObjectId: String || null,
  discourseFeedback: String,
  sourceData: {
    csv: {
      feedback: { type: String },
      date: Date,
      category: { type: String },
      organizationId: { type: String },
      interestedChannels: {
        channelID: { type: String },
        channelName: { type: String },
      },
      tags: [{ type: String }],
    },
    zendesk: {
      url: { type: String },
      id: { type: Number },
      created_at: { type: String },
      updated_at: { type: String },
      type: { type: String },
      subject: { type: String },
      description: { type: String },
      priority: { type: String },
      status: { type: String },
      requester_id: { type: Number },
      submitter_id: { type: Number },
      assignee_id: { type: Number },
      tags: [{ type: String }],
      custom_status_id: { type: Number },
      ticket_form_id: { type: Number },
    },
    g2: {
      // subdocument attributes need to be defined as objects
      id: { type: String },
      url: { type: String },
      product: {
        id: { type: String },
        slug: { type: String },
      },
      name: { type: String },
      type: { type: String },
      source: {
        review: { type: String },
        type: { type: String },
      },
      location: {
        country: { type: String },
        region: { type: String },
        primary: { type: String },
      },
      date: {
        submitted: { type: String },
        published: { type: String },
        updated: { type: String },
      },
      segment: { type: String },
      industry: { type: String },
      role: { type: String },
      answers_raw: { type: String },
      answers: [String],
    },
    slack: { type: mongoose.Schema.Types.Mixed },
  },
});

export default model<IFeedback>('feedbacks', feedbackSchema);
