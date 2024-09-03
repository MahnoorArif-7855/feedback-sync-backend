import { model, Schema, Types } from 'mongoose';

export interface IBlog {
  userId: string;
  slug: string;
  date: string;
  description: string;
  title: string;
  subtitle: string;
  image_url: string;
}

const BlogSchema = new Schema({
  userId: String,
  slug: String,
  date: String,
  description: String,
  title: String,
  subtitle: String,
  image_url: String,
});

export default model<IBlog>('blogs', BlogSchema);
