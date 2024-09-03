import { model, Schema, Types } from 'mongoose';

export interface IAdmin {
  _id: String;
  pricing: {
    freePlanWordsCount: Number;
    premiumPlanWordsCount: Number;
  };
}

const adminSchema = new Schema({
  _id: String,
  pricing: {
    freePlanWordsCount: Number,
    premiumPlanWordsCount: Number,
  },
});

export default model<IAdmin>('admin_settings', adminSchema);
