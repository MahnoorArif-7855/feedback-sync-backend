import { model, Schema, Types } from 'mongoose';

export interface IUser {
  userId: string;
  email: string;
  userName: string;
  organizationId: string;
  firebaseLogin: boolean;
  type: string;
  search_limit_user_only: boolean;
  userSearchCount: Number;
  organization: Types.ObjectId;
  lastActivity: string;
  lastActivityDate: Date;
}

const userSchema = new Schema({
  userId: String,
  email: String,
  userName: String,
  organizationId: String,
  type: String,
  firebaseLogin: Boolean,
  search_limit_user_only: Boolean,
  userSearchCount: Number,
  lastActivity: String,
  lastActivityDate: Date,
  step: Number,
  organization: { type: Schema.Types.ObjectId, ref: 'organizations' },
});

export default model<IUser>('users', userSchema);
