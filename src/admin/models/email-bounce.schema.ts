import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum BounceType {
  HARD_BOUNCE = 'hard_bounce',
  SOFT_BOUNCE = 'soft_bounce',
  BLOCKED = 'blocked',
  SPAM = 'spam',
  UNSUBSCRIBED = 'unsubscribed',
  INVALID_EMAIL = 'invalid_email'
}

@Schema({ timestamps: true })
export class EmailBounce {
  @Prop({ type: Types.ObjectId, ref: 'EmailTracking' })
  emailTrackingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign' })
  campaignId: Types.ObjectId;

  @Prop({ required: true })
  recipientEmail: string;

  @Prop({ type: String, enum: BounceType, required: true })
  bounceType: BounceType;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: String })
  smtpCode?: string;

  @Prop({ type: String })
  smtpMessage?: string;

  @Prop({ type: Date })
  bouncedAt: Date;

  @Prop({ type: Object })
  metadata?: {
    originalMessageId?: string;
    reportingMta?: string;
    diagnosticCode?: string;
    action?: string;
    status?: string;
  };

  @Prop({ type: Boolean, default: false })
  processed: boolean;

  @Prop({ type: Date })
  processedAt?: Date;
}

export type EmailBounceDocument = EmailBounce & Document;
export const EmailBounceSchema = SchemaFactory.createForClass(EmailBounce);

// Indexes for better query performance
EmailBounceSchema.index({ recipientEmail: 1 });
EmailBounceSchema.index({ campaignId: 1 });
EmailBounceSchema.index({ emailTrackingId: 1 });
EmailBounceSchema.index({ bounceType: 1 });
EmailBounceSchema.index({ processed: 1 });
EmailBounceSchema.index({ bouncedAt: -1 }); 