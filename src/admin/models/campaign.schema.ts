import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CampaignDocument = Campaign & Document;

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum CampaignType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ type: String, enum: CampaignType, default: CampaignType.EMAIL })
  type: CampaignType;

  @Prop({ type: String, enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Prop({ type: Date })
  scheduledAt: Date;

  @Prop({ type: Date })
  startedAt: Date;

  @Prop({ type: Date })
  completedAt: Date;

  @Prop({ type: Number, default: 0 })
  totalRecipients: number;

  @Prop({ type: Number, default: 0 })
  sentCount: number;

  @Prop({ type: Number, default: 0 })
  failedCount: number;

  @Prop({ type: Number, default: 0 })
  openedCount: number;

  @Prop({ type: Number, default: 0 })
  clickedCount: number;

  @Prop({ type: [String], default: [] })
  recipientEmails: string[];

  @Prop({ type: [String], default: [] })
  sentEmails: string[];

  @Prop({ type: [String], default: [] })
  failedEmails: string[];

  @Prop({ type: Object })
  settings: {
    sendInterval: number; // seconds between emails (default: 2)
    maxRetries: number; // max retry attempts (default: 3)
    includeUnsubscribed: boolean; // include unsubscribed users (default: false)
  };

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  createdBy: Types.ObjectId;

  @Prop({ type: String })
  createdByEmail: string;

  @Prop({ type: String })
  notes: string;

  @Prop({ type: Object })
  metadata: {
    lastError?: string;
    retryCount?: number;
    nextRetryAt?: Date;
  };
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);

// Indexes for better query performance
CampaignSchema.index({ status: 1, scheduledAt: 1 });
CampaignSchema.index({ createdBy: 1 });
CampaignSchema.index({ scheduledAt: 1, status: 1 }); 