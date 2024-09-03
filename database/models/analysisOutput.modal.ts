import { model, Schema, Types } from 'mongoose';

export interface IAnalysisOutput {
  analysis_type: string;
  organizationId: string;
  organizationName: string;
  user_id: string;
  output: {
    data: Types.Array<{
      heading: string;
      keywords: string[];
    }>;
    type: string;
    category: string;
  };
  date: Date;
  date_in_strings: string;
}

const AnalysisOutputs = new Schema({
  organizationId: String,
  analysis_type: String,
  organizationName: String,
  user_id: String,
  output: {
    data: [{ heading: String, keywords: [String] }],
    type: String,
    category: String,
  },
  date: Date,
  date_in_strings: String,
});

export default model<IAnalysisOutput>('analysis_outputs', AnalysisOutputs);
