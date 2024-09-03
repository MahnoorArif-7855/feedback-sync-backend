import { Double, Int32 } from 'mongodb';
import { model, Schema, Types } from 'mongoose';

export interface ISearch {
  userId: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  query: string;
  date: string;
  output: [
    {
      model: string;
      text: string;
      usage: {
        prompt_tokens: Int32;
        completion_tokens: Int32;
        total_tokens: Int32;
      };
    },
    {
      input_tokens_cost: Double;
      output_tokens_cost: Double;
      total_tokens_cost: Double;
    }
  ];
}

const SearchOutputSchema = new Schema({
  userId: String,
  email: String,
  userName: String,
  organizationId: String,
  organizationName: String,
  query: String,
  date: String,
  output: [
    {
      model: String,
      text: String,
      usage: {
        prompt_tokens: String,
        completion_tokens: String,
        total_tokens: String,
      },
    },
    {
      input_tokens_cost: String,
      output_tokens_cost: String,
      total_tokens_cost: String,
    },
  ],
});

export default model<ISearch>('search-output', SearchOutputSchema);
