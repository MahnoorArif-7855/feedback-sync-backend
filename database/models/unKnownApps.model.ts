import { model, Schema, Types } from 'mongoose';

export interface IUnKnownApps {}
const UnKnownAppsSchema = new Schema({}, { _id: true, strict: false });

export default model<IUnKnownApps>('unKnown-app', UnKnownAppsSchema);
