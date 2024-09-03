import { model, Schema } from 'mongoose';

export interface IFeedbackTags {
  organizationId: string;
  tags: [String];
}

const FeedbackTags = new Schema({
    organizationId: String,
    tags: [String],
});

export default model<IFeedbackTags>('tags', FeedbackTags);
