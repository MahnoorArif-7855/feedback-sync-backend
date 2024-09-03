import mongoose from 'mongoose';

export type G2Review = {
  id: string;
  url: string;
  product: {
    id: string;
    slug: string;
  };
  name: string;
  type: string;
  source: {
    review: string;
    type: string;
  };
  location: {
    country: string;
    region: string;
    primary: string;
  };
  date: {
    submitted: string;
    published: string;
    updated: string;
  };
  segment: string;
  industry: string;
  role: string;
  answers_raw: string;
  answers: [string];
};

export type ZendeskReview = {
  url: String;
  id: Number;
  created_at: String;
  updated_at: String;
  type: String;
  subject: String;
  description: String;
  priority: String;
  status: String;
  requester_id: Number;
  submitter_id: Number;
  assignee_id: Number;
  tags: [String];
  custom_status_id: Number;
  ticket_form_id: Number;
};
export type CSVReviews = {
  feedback: string;
  //   category: String,
  //   organization: String,
  date: Date;
  category: string;
  organizationId: string;
  interestedChannels: {
    channelID: string;
    channelName: string;
  };
  tags: [string];
};

export type WeaviateSearchResult = {
  feedback: string;
  mongoId: string;
  source: string | null;
  category: string | null;
  organization: string | null;
  score?: number;
};

export type discoursePayload = {
  id: number;
  name: string;
  username: string;
  avatar_template: string;
  created_at: string;
  cooked: string;
  post_number: number;
  post_type: number;
  updated_at: string;
  reply_count: number;
  reply_to_post_number: number | null;
  quote_count: number;
  incoming_link_count: number;
  reads: number;
  score: number;
  topic_id: number;
  topic_slug: string;
  topic_title: string;
  category_id: number;
  display_username: string;
  primary_group_name: string | null;
  flair_name: string | null;
  flair_group_id: number | null;
  version: number;
  user_title: string | null;
  bookmarked: boolean;
  raw: string;
  moderator: boolean;
  admin: boolean;
  staff: boolean;
  user_id: number;
  hidden: boolean;
  trust_level: number;
  deleted_at: string | null;
  user_deleted: boolean;
  edit_reason: string | null;
  wiki: boolean;
  reviewable_id: number | null;
  reviewable_score_count: number;
  reviewable_score_pending_count: number;
  topic_posts_count: number;
  topic_filtered_posts_count: number;
  topic_archetype: string;
  category_slug: string;
  akismet_state: string | null;
  user_cakedate: string;
  can_accept_answer: boolean;
  can_unaccept_answer: boolean;
  accepted_answer: boolean;
  topic_accepted_answer: boolean;
};

export type SlackAutoIngestPayload = { type: mongoose.Schema.Types.Mixed };
