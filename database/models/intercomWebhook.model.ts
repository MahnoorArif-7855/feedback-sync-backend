import { model, Schema, Types } from 'mongoose';

export interface IIntercomWebhook {
  type: String;
  app_id: String;
  data: {
    type: String;
    item: {
      type: String;
      id: String;
      created_at: Number;
      updated_at: Number;
      waiting_since: Number;
      snoozed_until: String;
      source: {
        type: String;
        id: String;
        delivered_as: String;
        subject: String;
        body: String;
        author: {
          type: String;
          id: String;
          name: String;
          email: String;
        };
        attachments: [];
        url: String;
        redacted: Boolean;
      };
      contacts: {
        type: String;
        contacts: [
          {
            type: String;
            id: String;
            external_id: String;
          }
        ];
      };
      first_contact_reply: {
        created_at: Number;
        type: String;
        url: String;
      };

      admin_assignee_id: String;
      team_assignee_id: String;
      open: Boolean;
      state: String;
      read: Boolean;
      tags: {
        type: String;
        tags: [];
      };
      priority: String;
      sla_applied: String;
      statistics: {
        type: String;
        time_to_assignment: String;
        time_to_admin_reply: String;
        time_to_first_close: String;
        time_to_last_close: String;
        median_time_to_reply: String;
        first_contact_reply_at: String;
        first_assignment_at: String;
        first_admin_reply_at: String;
        first_close_at: String;
        last_assignment_at: String;
        last_assignment_admin_reply_at: String;
        last_contact_reply_at: String;
        last_admin_reply_at: String;
        last_close_at: String;
        last_closed_by_id: String;
        count_reopens: Number;
        count_assignments: Number;
        count_conversation_parts: Number;
      };
      conversation_rating: String;
      teammates: {
        type: String;
        admins: [];
      };
      title: String;
      custom_attributes: {
        Language: String;
      };
      topics: {
        type: String;
        topics: [];
        total_count: 0;
      };
      ticket: String;
      linked_objects: {
        type: String;
        data: [];
        total_count: 0;
        has_more: Boolean;
      };
      ai_agent: String;
      ai_agent_participated: Boolean;
      conversation_parts: {
        type: String;
        conversation_parts: [
          {
            type: String;
            id: String;
            part_type: String;
            body: Boolean;
            created_at: Number;
            updated_at: Number;
            notified_at: Number;
            assigned_to: String;
            author: {
              id: String;
              type: String;
              name: String;
              email: String;
            };
            attachments: [];
            external_id: String;
            redacted: Boolean;
          }
        ];
        total_count: Number;
      };
    };
  };
  links: {};
  id: String;
  topic: String;
  delivery_status: String;
  delivery_attempts: Number;
  delivered_at: Number;
  first_sent_at: Number;
  created_at: Number;
  self: String;
}
const IntercomSchema = new Schema({}, { _id: true, strict: false });

export default model<IIntercomWebhook>('intercom-webhook', IntercomSchema);
