import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailBounce, EmailBounceDocument, BounceType } from '../models/email-bounce.schema';
import { EmailTrackingService } from './email-tracking.service';
import { EmailStatus } from '../models/email-tracking.schema';

@Injectable()
export class EmailBounceService {
  private readonly logger = new Logger(EmailBounceService.name);

  constructor(
    @InjectModel(EmailBounce.name) private emailBounceModel: Model<EmailBounceDocument>,
    private readonly emailTrackingService: EmailTrackingService
  ) {}

  /**
   * Process a bounce notification
   */
  async processBounce(bounceData: {
    recipientEmail: string;
    bounceType: BounceType;
    reason: string;
    smtpCode?: string;
    smtpMessage?: string;
    originalMessageId?: string;
    reportingMta?: string;
    diagnosticCode?: string;
    action?: string;
    status?: string;
  }): Promise<void> {
    console.log(`📧 [BOUNCE] Processing bounce for: ${bounceData.recipientEmail}`);
    console.log(`📧 [BOUNCE] Bounce type: ${bounceData.bounceType}`);
    console.log(`📧 [BOUNCE] Reason: ${bounceData.reason}`);

    // Find the corresponding email tracking record
    const trackingRecord = await this.emailTrackingService.findByEmail(bounceData.recipientEmail);
    
    if (!trackingRecord) {
      console.log(`⚠️ [BOUNCE] No tracking record found for: ${bounceData.recipientEmail}`);
      return;
    }

    console.log(`📧 [BOUNCE] Found tracking record: ${trackingRecord._id}`);

    // Create bounce record
    const bounceRecord = new this.emailBounceModel({
      emailTrackingId: trackingRecord._id,
      campaignId: trackingRecord.campaignId,
      recipientEmail: bounceData.recipientEmail,
      bounceType: bounceData.bounceType,
      reason: bounceData.reason,
      smtpCode: bounceData.smtpCode,
      smtpMessage: bounceData.smtpMessage,
      bouncedAt: new Date(),
      metadata: {
        originalMessageId: bounceData.originalMessageId,
        reportingMta: bounceData.reportingMta,
        diagnosticCode: bounceData.diagnosticCode,
        action: bounceData.action,
        status: bounceData.status
      },
      processed: false
    });

    await bounceRecord.save();
    console.log(`✅ [BOUNCE] Bounce record created: ${bounceRecord._id}`);

    // Update email tracking status based on bounce type
    await this.updateTrackingStatus((trackingRecord as any)._id.toString(), bounceData.bounceType, bounceData.reason);
  }

  /**
   * Update email tracking status based on bounce type
   */
  private async updateTrackingStatus(trackingId: string, bounceType: BounceType, reason: string): Promise<void> {
    console.log(`📝 [BOUNCE] Updating tracking status for: ${trackingId}`);

    const error: any = new Error(`Email bounced: ${reason}`);
    error.code = '550';
    error.response = reason;

    switch (bounceType) {
      case BounceType.HARD_BOUNCE:
      case BounceType.INVALID_EMAIL:
        console.log(`💀 [BOUNCE] Marking as permanently failed due to hard bounce`);
        await this.emailTrackingService.markAsPermanentlyFailed(trackingId, error);
        break;
      
      case BounceType.SOFT_BOUNCE:
        console.log(`🔄 [BOUNCE] Marking as failed for soft bounce - will retry`);
        await this.emailTrackingService.markAsFailed(trackingId, error);
        break;
      
      case BounceType.BLOCKED:
      case BounceType.SPAM:
        console.log(`🚫 [BOUNCE] Marking as permanently failed due to block/spam`);
        await this.emailTrackingService.markAsPermanentlyFailed(trackingId, error);
        break;
      
      case BounceType.UNSUBSCRIBED:
        console.log(`📧 [BOUNCE] Marking as permanently failed due to unsubscribe`);
        await this.emailTrackingService.markAsPermanentlyFailed(trackingId, error);
        break;
      
      default:
        console.log(`❓ [BOUNCE] Unknown bounce type, marking as failed`);
        await this.emailTrackingService.markAsFailed(trackingId, error);
        break;
    }

    // Mark bounce as processed
    await this.emailBounceModel.updateMany(
      { emailTrackingId: new Types.ObjectId(trackingId) },
      { processed: true, processedAt: new Date() }
    );

    console.log(`✅ [BOUNCE] Tracking status updated successfully`);
  }

  /**
   * Get bounce statistics
   */
  async getBounceStats(): Promise<{
    totalBounces: number;
    hardBounces: number;
    softBounces: number;
    blocked: number;
    spam: number;
    unsubscribed: number;
    invalidEmails: number;
    processedBounces: number;
    unprocessedBounces: number;
  }> {
    const stats = await this.emailBounceModel.aggregate([
      {
        $group: {
          _id: '$bounceType',
          count: { $sum: 1 }
        }
      }
    ]);

    const processedStats = await this.emailBounceModel.aggregate([
      {
        $group: {
          _id: '$processed',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalBounces: 0,
      hardBounces: 0,
      softBounces: 0,
      blocked: 0,
      spam: 0,
      unsubscribed: 0,
      invalidEmails: 0,
      processedBounces: 0,
      unprocessedBounces: 0
    };

    stats.forEach(stat => {
      result.totalBounces += stat.count;
      switch (stat._id) {
        case BounceType.HARD_BOUNCE:
          result.hardBounces = stat.count;
          break;
        case BounceType.SOFT_BOUNCE:
          result.softBounces = stat.count;
          break;
        case BounceType.BLOCKED:
          result.blocked = stat.count;
          break;
        case BounceType.SPAM:
          result.spam = stat.count;
          break;
        case BounceType.UNSUBSCRIBED:
          result.unsubscribed = stat.count;
          break;
        case BounceType.INVALID_EMAIL:
          result.invalidEmails = stat.count;
          break;
      }
    });

    processedStats.forEach(stat => {
      if (stat._id === true) {
        result.processedBounces = stat.count;
      } else {
        result.unprocessedBounces = stat.count;
      }
    });

    return result;
  }

  /**
   * Get bounces for a specific campaign
   */
  async getCampaignBounces(campaignId: string): Promise<EmailBounceDocument[]> {
    return await this.emailBounceModel.find({
      campaignId: new Types.ObjectId(campaignId)
    }).sort({ bouncedAt: -1 });
  }

  /**
   * Get unprocessed bounces
   */
  async getUnprocessedBounces(): Promise<EmailBounceDocument[]> {
    return await this.emailBounceModel.find({
      processed: false
    }).sort({ bouncedAt: -1 });
  }

  /**
   * Process all unprocessed bounces
   */
  async processUnprocessedBounces(): Promise<{ processed: number; errors: number }> {
    console.log(`🔄 [BOUNCE] Processing unprocessed bounces...`);
    
    const unprocessedBounces = await this.getUnprocessedBounces();
    let processed = 0;
    let errors = 0;

    for (const bounce of unprocessedBounces) {
      try {
        await this.updateTrackingStatus(
          bounce.emailTrackingId.toString(),
          bounce.bounceType,
          bounce.reason
        );
        processed++;
      } catch (error) {
        console.error(`❌ [BOUNCE] Error processing bounce ${bounce._id}:`, error);
        errors++;
      }
    }

    console.log(`✅ [BOUNCE] Processed ${processed} bounces, ${errors} errors`);
    return { processed, errors };
  }
} 