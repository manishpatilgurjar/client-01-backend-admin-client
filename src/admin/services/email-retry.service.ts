import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailTrackingService } from './email-tracking.service';
import { MailService } from '../../mail/mail.service';
import { CampaignService } from './campaign.service';

@Injectable()
export class EmailRetryService {
  private readonly logger = new Logger(EmailRetryService.name);

  constructor(
    private readonly emailTrackingService: EmailTrackingService,
    private readonly mailService: MailService,
    private readonly campaignService: CampaignService
  ) {}

  /**
   * Process pending retries every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processPendingRetries() {
    this.logger.log('🔄 [RETRY] Processing pending email retries...');
    
    try {
      const pendingRetries = await this.emailTrackingService.getPendingRetries();
      
      if (pendingRetries.length === 0) {
        this.logger.log('✅ [RETRY] No pending retries found');
        return;
      }

      this.logger.log(`📧 [RETRY] Found ${pendingRetries.length} pending retries`);
      console.log(`📧 [RETRY] Pending retries:`, pendingRetries.map(r => ({
        id: r._id,
        email: r.recipientEmail,
        retryCount: r.retryCount,
        nextRetryAt: r.nextRetryAt
      })));

      for (const emailTracking of pendingRetries) {
        await this.processRetry(emailTracking);
      }
    } catch (error) {
      this.logger.error('❌ [RETRY] Error processing pending retries:', error);
      console.error('❌ [RETRY] Error details:', error);
    }
  }

  /**
   * Process a single email retry
   */
  private async processRetry(emailTracking: any): Promise<void> {
    console.log(`\n🔄 [RETRY] Processing retry for email: ${emailTracking.recipientEmail}`);
    console.log(`🆔 [RETRY] Tracking ID: ${emailTracking._id}`);
    console.log(`📊 [RETRY] Current retry count: ${emailTracking.retryCount}`);
    console.log(`📊 [RETRY] Max retries: ${emailTracking.maxRetries}`);
    console.log(`📊 [RETRY] Next retry at: ${emailTracking.nextRetryAt}`);

    try {
      this.logger.log(`🔄 [RETRY] Retrying email to ${emailTracking.recipientEmail} (attempt ${emailTracking.retryCount + 1})`);
      console.log(`📤 [RETRY] Attempting to send email to ${emailTracking.recipientEmail}`);

      // Send the email
      await this.mailService.sendCampaignEmail(
        emailTracking.recipientEmail,
        emailTracking.subject,
        emailTracking.content || ''
      );

      console.log(`✅ [RETRY] Email sent successfully to ${emailTracking.recipientEmail}`);

      // Mark as sent
      console.log(`📝 [RETRY] Marking email as sent in tracking`);
      await this.emailTrackingService.markAsSent(emailTracking._id.toString());
      
      this.logger.log(`✅ [RETRY] Successfully retried email to ${emailTracking.recipientEmail}`);
      console.log(`✅ [RETRY] Email retry completed successfully for ${emailTracking.recipientEmail}`);

    } catch (error) {
      this.logger.error(`❌ [RETRY] Retry failed for ${emailTracking.recipientEmail}:`, error);
      console.error(`❌ [RETRY] Retry failed for ${emailTracking.recipientEmail}:`, error);
      console.error(`❌ [RETRY] Error details:`, {
        message: error.message,
        code: error.code,
        response: error.response,
        stack: error.stack
      });

      // Check if we should give up or schedule another retry
      if (emailTracking.retryCount >= emailTracking.maxRetries - 1) {
        // Max retries reached, mark as permanently failed
        console.log(`💀 [RETRY] Max retries reached for ${emailTracking.recipientEmail}, marking as permanently failed`);
        await this.emailTrackingService.markAsPermanentlyFailed(emailTracking._id.toString(), error);
        this.logger.log(`💀 [RETRY] Email to ${emailTracking.recipientEmail} marked as permanently failed`);
        console.log(`💀 [RETRY] Email marked as permanently failed for ${emailTracking.recipientEmail}`);
      } else {
        // Schedule another retry with exponential backoff
        const retryDelay = Math.min(5 * Math.pow(2, emailTracking.retryCount), 60); // Max 60 minutes
        console.log(`🔄 [RETRY] Scheduling another retry for ${emailTracking.recipientEmail} in ${retryDelay} minutes`);
        await this.emailTrackingService.scheduleRetry(emailTracking._id.toString(), retryDelay);
        this.logger.log(`🔄 [RETRY] Scheduled retry for ${emailTracking.recipientEmail} in ${retryDelay} minutes`);
        console.log(`🔄 [RETRY] Retry scheduled successfully for ${emailTracking.recipientEmail}`);
      }
    }
  }

  /**
   * Manually trigger retry processing (for testing or immediate processing)
   */
  async triggerRetryProcessing(): Promise<{ processed: number; success: number; failed: number }> {
    this.logger.log('Manually triggering retry processing...');
    
    const pendingRetries = await this.emailTrackingService.getPendingRetries();
    let success = 0;
    let failed = 0;

    for (const emailTracking of pendingRetries) {
      try {
        await this.processRetry(emailTracking);
        success++;
      } catch (error) {
        failed++;
        this.logger.error(`Failed to process retry for ${emailTracking.recipientEmail}:`, error);
      }
    }

    const result = {
      processed: pendingRetries.length,
      success,
      failed
    };

    this.logger.log(`Retry processing completed: ${JSON.stringify(result)}`);
    return result;
  }

  /**
   * Get retry statistics
   */
  async getRetryStats(): Promise<{
    pendingRetries: number;
    totalRetries: number;
    successRate: number;
  }> {
    const pendingRetries = await this.emailTrackingService.getPendingRetries();
    const globalStats = await this.emailTrackingService.getGlobalStats();

    const totalRetries = globalStats.retryingEmails + globalStats.failedEmails + globalStats.permanentlyFailedEmails;
    const successRate = totalRetries > 0 ? (globalStats.sentEmails / totalRetries) * 100 : 0;

    return {
      pendingRetries: pendingRetries.length,
      totalRetries,
      successRate
    };
  }
} 