import { model, Schema, Types } from 'mongoose';

export interface IZendeskTicketComments {
  ticketId: number;
  comment: string;
  feedbackId: string;
}

const zendeskTicketSchema = new Schema({
  ticketId: Number,
  comment: String,
  feedbackId: String,
});

export default model<IZendeskTicketComments>('zendesk-ticket-comments', zendeskTicketSchema);
