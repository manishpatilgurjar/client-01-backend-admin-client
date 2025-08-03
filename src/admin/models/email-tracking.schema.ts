import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying',
  PERMANENTLY_FAILED = 'permanently_failed'
}

export enum FailureReason {
  INVALID_EMAIL = 'invalid_email',
  MAILBOX_FULL = 'mailbox_full',
  DOMAIN_NOT_FOUND = 'domain_not_found',
  USER_NOT_FOUND = 'user_not_found',
  SMTP_ERROR = 'smtp_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT = 'rate_limit',
  AUTHENTICATION_ERROR = 'authentication_error',
  UNKNOWN = 'unknown'
}

@Schema({ timestamps: true })
export class EmailTracking {
  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: true })
  campaignId: Types.ObjectId;

  @Prop({ required: true })
  recipientEmail: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ type: String, enum: EmailStatus, default: EmailStatus.PENDING })
  status: EmailStatus;

  @Prop({ type: String, enum: FailureReason })
  failureReason?: FailureReason;

  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ type: Number, default: 0 })
  retryCount: number;

  @Prop({ type: Number, default: 3 })
  maxRetries: number;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: Date })
  failedAt?: Date;

           @Prop({ type: Date })
         nextRetryAt?: Date;

         @Prop({ type: Date })
         openedAt?: Date;

         @Prop({ type: Date })
         clickedAt?: Date;

         @Prop({ type: Object })
         smtpResponse?: {
           code: string;
           message: string;
           response: string;
         };

  @Prop({ type: Object })
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    campaignName?: string;
    recipientName?: string;
  };

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  createdBy: Types.ObjectId;

  @Prop({ type: String })
  createdByEmail: string;
}

export type EmailTrackingDocument = EmailTracking & Document;
export const EmailTrackingSchema = SchemaFactory.createForClass(EmailTracking);

// Indexes for better query performance
EmailTrackingSchema.index({ campaignId: 1, status: 1 });
EmailTrackingSchema.index({ recipientEmail: 1 });
EmailTrackingSchema.index({ status: 1, nextRetryAt: 1 });
EmailTrackingSchema.index({ createdAt: -1 }); 