import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailTracking, EmailTrackingDocument, EmailStatus, FailureReason } from '../models/email-tracking.schema';

@Injectable()
export class EmailTrackingService {
  constructor(
    @InjectModel(EmailTracking.name) private emailTrackingModel: Model<EmailTrackingDocument>
  ) {}

  /**
   * Create a new email tracking record
   */
  async createTrackingRecord(data: {
    campaignId: string;
    recipientEmail: string;
    subject: string;
    maxRetries?: number;
    createdBy?: string;
    createdByEmail?: string;
    metadata?: any;
  }): Promise<EmailTrackingDocument> {
    const trackingRecord = new this.emailTrackingModel({
      campaignId: new Types.ObjectId(data.campaignId),
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      maxRetries: data.maxRetries || 3,
      createdBy: data.createdBy ? new Types.ObjectId(data.createdBy) : undefined,
      createdByEmail: data.createdByEmail,
      metadata: data.metadata,
      status: EmailStatus.PENDING
    });

    const savedRecord = await trackingRecord.save();
    return savedRecord;
  }

  /**
   * Mark email as sent successfully
   */
  async markAsSent(trackingId: string): Promise<void> {
    await this.emailTrackingModel.findByIdAndUpdate(trackingId, {
      status: EmailStatus.SENT,
      sentAt: new Date(),
      $unset: { 
        failureReason: 1, 
        errorMessage: 1, 
        failedAt: 1, 
        nextRetryAt: 1,
        smtpResponse: 1
      }
    });
  }

  /**
   * Mark email as failed with error details
   */
  async markAsFailed(trackingId: string, error: any): Promise<void> {
    const failureReason = this.categorizeFailure(error);
    const errorMessage = this.extractErrorMessage(error);
    const smtpResponse = this.extractSmtpResponse(error);

    await this.emailTrackingModel.findByIdAndUpdate(trackingId, {
      status: EmailStatus.FAILED,
      failureReason,
      errorMessage,
      failedAt: new Date(),
      smtpResponse
    });
  }

  /**
   * Mark email as permanently failed (max retries exceeded)
   */
  async markAsPermanentlyFailed(trackingId: string, error: any): Promise<void> {
    const failureReason = this.categorizeFailure(error);
    const errorMessage = this.extractErrorMessage(error);
    const smtpResponse = this.extractSmtpResponse(error);

    await this.emailTrackingModel.findByIdAndUpdate(trackingId, {
      status: EmailStatus.PERMANENTLY_FAILED,
      failureReason,
      errorMessage,
      failedAt: new Date(),
      smtpResponse
    });
  }

  /**
   * Increment retry count and schedule next retry
   */
  async scheduleRetry(trackingId: string, retryDelayMinutes: number = 5): Promise<void> {
    const tracking = await this.emailTrackingModel.findById(trackingId);
    if (!tracking) {
      return;
    }

    const nextRetryAt = new Date();
    nextRetryAt.setMinutes(nextRetryAt.getMinutes() + retryDelayMinutes);

    await this.emailTrackingModel.findByIdAndUpdate(trackingId, {
      status: EmailStatus.RETRYING,
      retryCount: tracking.retryCount + 1,
      nextRetryAt
    });
  }

  /**
   * Get failed emails for a campaign
   */
  async getFailedEmails(campaignId: string): Promise<EmailTrackingDocument[]> {
    return await this.emailTrackingModel.find({
      campaignId: new Types.ObjectId(campaignId),
      status: { $in: [EmailStatus.FAILED, EmailStatus.PERMANENTLY_FAILED] }
    }).sort({ failedAt: -1 });
  }

  /**
   * Get pending retry emails
   */
  async getPendingRetries(): Promise<EmailTrackingDocument[]> {
    return await this.emailTrackingModel.find({
      status: EmailStatus.RETRYING,
      nextRetryAt: { $lte: new Date() }
    }).populate('campaignId');
  }

  /**
   * Get email statistics for a campaign
   */
  async getCampaignStats(campaignId: string): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    retrying: number;
    permanentlyFailed: number;
  }> {
    const stats = await this.emailTrackingModel.aggregate([
      { $match: { campaignId: new Types.ObjectId(campaignId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      retrying: 0,
      permanentlyFailed: 0
    };

    stats.forEach(stat => {
      result.total += stat.count;
      switch (stat._id) {
        case EmailStatus.SENT:
          result.sent = stat.count;
          break;
        case EmailStatus.FAILED:
          result.failed = stat.count;
          break;
        case EmailStatus.PENDING:
          result.pending = stat.count;
          break;
        case EmailStatus.RETRYING:
          result.retrying = stat.count;
          break;
        case EmailStatus.PERMANENTLY_FAILED:
          result.permanentlyFailed = stat.count;
          break;
      }
    });

    return result;
  }

  /**
   * Get global email statistics
   */
  async getGlobalStats(): Promise<{
    totalEmails: number;
    sentEmails: number;
    failedEmails: number;
    pendingEmails: number;
    retryingEmails: number;
    permanentlyFailedEmails: number;
    failureRate: number;
  }> {
    const stats = await this.emailTrackingModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalEmails: 0,
      sentEmails: 0,
      failedEmails: 0,
      pendingEmails: 0,
      retryingEmails: 0,
      permanentlyFailedEmails: 0,
      failureRate: 0
    };

    stats.forEach(stat => {
      result.totalEmails += stat.count;
      switch (stat._id) {
        case EmailStatus.SENT:
          result.sentEmails = stat.count;
          break;
        case EmailStatus.FAILED:
          result.failedEmails = stat.count;
          break;
        case EmailStatus.PENDING:
          result.pendingEmails = stat.count;
          break;
        case EmailStatus.RETRYING:
          result.retryingEmails = stat.count;
          break;
        case EmailStatus.PERMANENTLY_FAILED:
          result.permanentlyFailedEmails = stat.count;
          break;
      }
    });

    if (result.totalEmails > 0) {
      result.failureRate = ((result.failedEmails + result.permanentlyFailedEmails) / result.totalEmails) * 100;
    }

    return result;
  }

  /**
   * Get all tracking records
   */
  async getAllTrackingRecords(): Promise<EmailTrackingDocument[]> {
    return await this.emailTrackingModel.find().sort({ createdAt: -1 });
  }

  /**
   * Get all failed emails (across all campaigns)
   */
  async getAllFailedEmails(): Promise<EmailTrackingDocument[]> {
    return await this.emailTrackingModel.find({
      status: { $in: [EmailStatus.FAILED, EmailStatus.PERMANENTLY_FAILED] }
    }).sort({ failedAt: -1 });
  }

  /**
   * Find tracking record by email address
   */
  async findByEmail(email: string): Promise<EmailTrackingDocument | null> {
    return await this.emailTrackingModel.findOne({
      recipientEmail: email
    }).sort({ createdAt: -1 });
  }

  /**
   * Mark email as opened
   */
  async markAsOpened(trackingId: string, data?: { openedAt?: Date; userAgent?: string; ip?: string }) {
    console.log(`👁️ [EMAIL-TRACKING] Marking email as opened: ${trackingId}`);
    
    try {
      const updateData: any = {
        openedAt: data?.openedAt || new Date()
      };

      if (data?.userAgent) {
        updateData['metadata.userAgent'] = data.userAgent;
      }
      if (data?.ip) {
        updateData['metadata.ipAddress'] = data.ip;
      }

      const result = await this.emailTrackingModel.findByIdAndUpdate(
        trackingId,
        { $set: updateData },
        { new: true }
      ).exec();

      console.log(`✅ [EMAIL-TRACKING] Email marked as opened: ${trackingId}`);
      return result;
    } catch (error) {
      console.error(`❌ [EMAIL-TRACKING] Failed to mark email as opened:`, error);
      throw error;
    }
  }

  /**
   * Mark email as clicked
   */
  async markAsClicked(trackingId: string, data?: { clickedAt?: Date; url?: string; userAgent?: string; ip?: string }) {
    console.log(`🖱️ [EMAIL-TRACKING] Marking email as clicked: ${trackingId}`);
    
    try {
      const updateData: any = {
        clickedAt: data?.clickedAt || new Date()
      };

      if (data?.url) {
        updateData['metadata.clickedUrl'] = data.url;
      }
      if (data?.userAgent) {
        updateData['metadata.userAgent'] = data.userAgent;
      }
      if (data?.ip) {
        updateData['metadata.ipAddress'] = data.ip;
      }

      const result = await this.emailTrackingModel.findByIdAndUpdate(
        trackingId,
        { $set: updateData },
        { new: true }
      ).exec();

      console.log(`✅ [EMAIL-TRACKING] Email marked as clicked: ${trackingId}`);
      return result;
    } catch (error) {
      console.error(`❌ [EMAIL-TRACKING] Failed to mark email as clicked:`, error);
      throw error;
    }
  }

  /**
   * Categorize failure based on error details
   */
  private categorizeFailure(error: any): FailureReason {
    if (!error) return FailureReason.UNKNOWN;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toString() || '';

    // Check for specific SMTP error codes
    if (errorCode === '550' || errorMessage.includes('user not found') || errorMessage.includes('address not found')) {
      return FailureReason.USER_NOT_FOUND;
    }

    if (errorCode === '553' || errorMessage.includes('domain not found')) {
      return FailureReason.DOMAIN_NOT_FOUND;
    }

    if (errorCode === '552' || errorMessage.includes('mailbox full')) {
      return FailureReason.MAILBOX_FULL;
    }

    if (errorCode === '421' || errorMessage.includes('rate limit')) {
      return FailureReason.RATE_LIMIT;
    }

    if (errorCode === '535' || errorMessage.includes('authentication')) {
      return FailureReason.AUTHENTICATION_ERROR;
    }

    if (errorMessage.includes('invalid email') || errorMessage.includes('malformed')) {
      return FailureReason.INVALID_EMAIL;
    }

    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      return FailureReason.NETWORK_ERROR;
    }

    if (errorCode.startsWith('5') || errorMessage.includes('smtp')) {
      return FailureReason.SMTP_ERROR;
    }

    return FailureReason.UNKNOWN;
  }

  /**
   * Extract error message from error object
   */
  private extractErrorMessage(error: any): string {
    if (!error) return 'Unknown error';

    if (error.message) {
      return error.message;
    }

    if (error.response) {
      return error.response;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown error occurred';
  }

  /**
   * Extract SMTP response details
   */
  private extractSmtpResponse(error: any): any {
    if (!error) return null;

    return {
      code: error.code?.toString() || '',
      message: error.message || '',
      response: error.response || error.toString()
    };
  }
} 