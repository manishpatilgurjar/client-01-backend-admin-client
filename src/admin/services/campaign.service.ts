import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument, CampaignStatus, CampaignType } from '../models/campaign.schema';
import { CreateCampaignDto, UpdateCampaignDto, CampaignResponseDto, CampaignStatsDto, RunCampaignDto } from '../enums/campaign.dto';
import { MailService } from '../../mail/mail.service';
import { EnquiryModel } from '../models/enquiry.schema';
import { ActivityLogService } from './activity-log.service';
import { EmailTrackingService } from './email-tracking.service';
import { EmailTrackingDocument } from '../models/email-tracking.schema';
import { EmailBounceService } from './email-bounce.service';
import { BounceType } from '../models/email-bounce.schema';
import { SendGridService } from './sendgrid.service';

@Injectable()
export class CampaignService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    private readonly mailService: MailService,
    private readonly activityLogService: ActivityLogService,
    private readonly emailTrackingService: EmailTrackingService,
    private readonly emailBounceService: EmailBounceService,
    private readonly sendGridService: SendGridService
  ) {}

  /**
   * Create a new campaign
   */
  async createCampaign(dto: CreateCampaignDto, userId: string, userEmail: string): Promise<CampaignResponseDto> {
    // Handle the case where userId might not be a valid ObjectId (temporary admin user)
    let createdBy: Types.ObjectId | undefined;
    try {
      createdBy = new Types.ObjectId(userId);
    } catch (error) {
      // If userId is not a valid ObjectId (like 'admin'), we'll leave createdBy as undefined
      // This will be handled by the schema or we can set it to null
      createdBy = undefined;
    }

    const campaign = new this.campaignModel({
      ...dto,
      createdBy: createdBy,
      createdByEmail: userEmail,
      settings: {
        sendInterval: dto.sendInterval || 2,
        maxRetries: dto.maxRetries || 3,
        includeUnsubscribed: dto.includeUnsubscribed || false
      },
      status: dto.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT
    });

    const savedCampaign = await campaign.save();

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Campaign Created',
      entity: 'Campaign',
      entityId: (savedCampaign as any)._id.toString(),
      entityName: savedCampaign.name,
      userId: createdBy ? createdBy.toString() : userId,
      userEmail: userEmail,
      type: 'create'
    });



    return this.mapToResponseDto(savedCampaign);
  }

  /**
   * Get all campaigns with pagination
   */
  async getAllCampaigns(page: number = 1, limit: number = 10, status?: CampaignStatus): Promise<{
    campaigns: CampaignResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }

    const [campaigns, total] = await Promise.all([
      this.campaignModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.campaignModel.countDocuments(filter).exec()
    ]);

    return {
      campaigns: campaigns.map(campaign => this.mapToResponseDto(campaign)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string): Promise<CampaignResponseDto> {
    const campaign = await this.campaignModel.findById(id);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return this.mapToResponseDto(campaign);
  }

  /**
   * Update campaign
   */
  async updateCampaign(id: string, dto: UpdateCampaignDto, userId: string, userEmail: string): Promise<CampaignResponseDto> {
    const campaign = await this.campaignModel.findById(id);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Don't allow updates if campaign is running
    if (campaign.status === CampaignStatus.RUNNING) {
      throw new BadRequestException('Cannot update a running campaign');
    }

    // Update status based on scheduledAt
    if (dto.scheduledAt && !dto.status) {
      dto.status = CampaignStatus.SCHEDULED;
    }

    const updatedCampaign = await this.campaignModel.findByIdAndUpdate(
      id,
      { ...dto },
      { new: true }
    );

    if (!updatedCampaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Campaign Updated',
      entity: 'Campaign',
      entityId: id,
      entityName: updatedCampaign.name,
      userId: userId,
      userEmail: userEmail,
      type: 'update'
    });



    return this.mapToResponseDto(updatedCampaign);
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string, userId: string, userEmail: string): Promise<{ message: string }> {
    const campaign = await this.campaignModel.findById(id);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Don't allow deletion if campaign is running
    if (campaign.status === CampaignStatus.RUNNING) {
      throw new BadRequestException('Cannot delete a running campaign');
    }

    await this.campaignModel.findByIdAndDelete(id);

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Campaign Deleted',
      entity: 'Campaign',
      entityId: id,
      entityName: campaign.name,
      userId: userId,
      userEmail: userEmail,
      type: 'delete'
    });

    return { message: 'Campaign deleted successfully' };
  }

  /**
   * Run campaign immediately
   */
  async runCampaign(id: string, dto: RunCampaignDto, userId: string, userEmail: string): Promise<{ message: string; campaignId: string }> {
    const campaign = await this.campaignModel.findById(id);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status === CampaignStatus.RUNNING) {
      throw new BadRequestException('Campaign is already running');
    }

    if (campaign.status === CampaignStatus.COMPLETED) {
      throw new BadRequestException('Campaign has already been completed');
    }

    // Get recipient emails
    let recipientEmails: string[] = [];
    
    if (dto.customEmails && dto.customEmails.length > 0) {
      recipientEmails = dto.customEmails;
    } else {
      // Get unique emails from enquiry table
      const enquiries = await EnquiryModel.find({}, 'email').exec();
      recipientEmails = [...new Set(enquiries.map(e => e.email).filter(email => email))];
    }

    if (recipientEmails.length === 0) {
      throw new BadRequestException('No recipient emails found');
    }

    // Update campaign status and recipient info
    await this.campaignModel.findByIdAndUpdate(id, {
      status: CampaignStatus.RUNNING,
      startedAt: new Date(),
      totalRecipients: recipientEmails.length,
      recipientEmails: recipientEmails,
      sentCount: 0,
      failedCount: 0
    });

    // Start sending emails in background (non-blocking)
    this.sendCampaignEmails(id, recipientEmails).catch(error => {
      console.error(`Campaign ${id} failed:`, error);
    });

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Campaign Started',
      entity: 'Campaign',
      entityId: id,
      entityName: campaign.name,
      userId: userId,
      userEmail: userEmail,
      type: 'update'
    });

    return { 
      message: `Campaign started. Will send ${recipientEmails.length} emails.`,
      campaignId: id
    };
  }

  /**
   * Cancel campaign
   */
  async cancelCampaign(id: string, userId: string, userEmail: string): Promise<{ message: string }> {
    const campaign = await this.campaignModel.findById(id);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.SCHEDULED && campaign.status !== CampaignStatus.RUNNING) {
      throw new BadRequestException('Campaign cannot be cancelled');
    }

    await this.campaignModel.findByIdAndUpdate(id, {
      status: CampaignStatus.CANCELLED,
      completedAt: new Date()
    });

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Campaign Cancelled',
      entity: 'Campaign',
      entityId: id,
      entityName: campaign.name,
      userId: userId,
      userEmail: userEmail,
      type: 'update'
    });

    return { message: 'Campaign cancelled successfully' };
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(): Promise<CampaignStatsDto> {
    console.log(`📊 [CAMPAIGN-STATS] Fetching campaign statistics...`);

    const [
      totalCampaigns,
      draftCampaigns,
      scheduledCampaigns,
      runningCampaigns,
      completedCampaigns,
      failedCampaigns,
      totalEmailsSent,
      totalEmailsFailed,
      emailTrackingStats
    ] = await Promise.all([
      this.campaignModel.countDocuments(),
      this.campaignModel.countDocuments({ status: CampaignStatus.DRAFT }),
      this.campaignModel.countDocuments({ status: CampaignStatus.SCHEDULED }),
      this.campaignModel.countDocuments({ status: CampaignStatus.RUNNING }),
      this.campaignModel.countDocuments({ status: CampaignStatus.COMPLETED }),
      this.campaignModel.countDocuments({ status: CampaignStatus.FAILED }),
      this.campaignModel.aggregate([
        { $group: { _id: null, total: { $sum: '$sentCount' } } }
      ]),
      this.campaignModel.aggregate([
        { $group: { _id: null, total: { $sum: '$failedCount' } } }
      ]),
      this.emailTrackingService.getGlobalStats()
    ]);

    const totalSent = totalEmailsSent[0]?.total || 0;
    const totalFailed = totalEmailsFailed[0]?.total || 0;
    const totalOpened = await this.campaignModel.aggregate([
      { $group: { _id: null, total: { $sum: '$openedCount' } } }
    ]);
    const totalClicked = await this.campaignModel.aggregate([
      { $group: { _id: null, total: { $sum: '$clickedCount' } } }
    ]);

    const totalOpenedCount = totalOpened[0]?.total || 0;
    const totalClickedCount = totalClicked[0]?.total || 0;

    console.log(`📊 [CAMPAIGN-STATS] Campaign counts:`, {
      totalCampaigns,
      draftCampaigns,
      scheduledCampaigns,
      runningCampaigns,
      completedCampaigns,
      failedCampaigns
    });

    console.log(`📊 [CAMPAIGN-STATS] Email counts from campaigns:`, {
      totalSent,
      totalFailed,
      totalOpenedCount,
      totalClickedCount
    });

    console.log(`📊 [CAMPAIGN-STATS] Email tracking stats:`, emailTrackingStats);

    const result = {
      totalCampaigns,
      draftCampaigns,
      scheduledCampaigns,
      runningCampaigns,
      completedCampaigns,
      failedCampaigns,
      totalEmailsSent: totalSent,
      totalEmailsFailed: totalFailed,
      averageOpenRate: totalSent > 0 ? (totalOpenedCount / totalSent) * 100 : 0,
      averageClickRate: totalSent > 0 ? (totalClickedCount / totalSent) * 100 : 0,
      // Add email tracking statistics
      totalEmailsTracked: emailTrackingStats.totalEmails,
      pendingEmails: emailTrackingStats.pendingEmails,
      retryingEmails: emailTrackingStats.retryingEmails,
      permanentlyFailedEmails: emailTrackingStats.permanentlyFailedEmails,
      emailFailureRate: emailTrackingStats.failureRate
    };

    console.log(`📊 [CAMPAIGN-STATS] Final result:`, result);
    return result;
  }

  /**
   * Get scheduled campaigns that need to be run
   */
  async getScheduledCampaigns(): Promise<CampaignDocument[]> {
    const now = new Date();
    return this.campaignModel.find({
      status: CampaignStatus.SCHEDULED,
      scheduledAt: { $lte: now }
    }).exec();
  }

  /**
   * Get scheduled campaigns for a specific date range (for daily scheduler)
   */
  async getScheduledCampaignsForDateRange(startDate: Date, endDate: Date): Promise<CampaignDocument[]> {
    return this.campaignModel.find({
      status: CampaignStatus.SCHEDULED,
      scheduledAt: { 
        $gte: startDate,
        $lte: endDate
      }
    }).exec();
  }

  /**
   * Send campaign emails (background process) with comprehensive tracking
   */
  private async sendCampaignEmails(campaignId: string, recipientEmails: string[]): Promise<void> {
    console.log(`🚀 [CAMPAIGN] Starting email sending process for campaign ${campaignId}`);
    console.log(`📧 [CAMPAIGN] Total recipients: ${recipientEmails.length}`);
    console.log(`📧 [CAMPAIGN] Recipient emails:`, recipientEmails);

    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) {
      console.error(`❌ [CAMPAIGN] Campaign ${campaignId} not found`);
      return;
    }

    const sendInterval = campaign.settings?.sendInterval || 2;
    const maxRetries = campaign.settings?.maxRetries || 3;
    let sentCount = 0;
    let failedCount = 0;
    const sentEmails: string[] = [];
    const failedEmails: string[] = [];

    console.log(`⚙️ [CAMPAIGN] Settings - Send Interval: ${sendInterval}s, Max Retries: ${maxRetries}`);

    // Create tracking records for all emails
    console.log(`📝 [CAMPAIGN] Creating tracking records for ${recipientEmails.length} emails...`);
    const trackingRecords: EmailTrackingDocument[] = await Promise.all(
      recipientEmails.map(async (email, index) => {
        console.log(`📝 [CAMPAIGN] Creating tracking record ${index + 1}/${recipientEmails.length} for ${email}`);
        const record = await this.emailTrackingService.createTrackingRecord({
          campaignId,
          recipientEmail: email,
          subject: campaign.subject,
          maxRetries,
          createdBy: campaign.createdBy?.toString(),
          createdByEmail: campaign.createdByEmail,
          metadata: {
            campaignName: campaign.name,
            sendInterval
          }
        });
        console.log(`✅ [CAMPAIGN] Tracking record created for ${email} with ID: ${(record as any)._id}`);
        return record;
      })
    );

    console.log(`✅ [CAMPAIGN] All tracking records created successfully`);

    for (let i = 0; i < recipientEmails.length; i++) {
      const email = recipientEmails[i];
      const trackingRecord = trackingRecords[i];
      let retryCount = 0;
      let success = false;

      console.log(`\n📧 [CAMPAIGN] Processing email ${i + 1}/${recipientEmails.length}: ${email}`);
      console.log(`🆔 [CAMPAIGN] Tracking record ID: ${(trackingRecord as any)._id}`);

      while (retryCount < maxRetries && !success) {
        try {
          console.log(`📤 [CAMPAIGN] Attempting to send email to ${email} (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Send email using SendGrid for campaigns
          const sendGridResult = await this.sendGridService.sendCampaignEmail({
            to: email,
            subject: campaign.subject,
            content: campaign.content,
            campaignId: campaignId,
            trackingId: (trackingRecord as any)._id.toString()
          });
          
          success = true;
          sentCount++;
          sentEmails.push(email);
          
          console.log(`✅ [CAMPAIGN] Email sent successfully to ${email} via SendGrid`);
          console.log(`📧 [CAMPAIGN] SendGrid Message ID: ${sendGridResult.messageId}`);
          
          // Mark as sent in tracking
          console.log(`📝 [CAMPAIGN] Marking email as sent in tracking for ${email}`);
          await this.emailTrackingService.markAsSent((trackingRecord as any)._id.toString());
          console.log(`✅ [CAMPAIGN] Email marked as sent in tracking for ${email}`);
          
        } catch (error) {
          retryCount++;
          console.error(`❌ [CAMPAIGN] Failed to send email to ${email} (attempt ${retryCount}/${maxRetries}):`, error);
          console.error(`❌ [CAMPAIGN] Error details:`, {
            message: error.message,
            code: error.code,
            response: error.response,
            stack: error.stack
          });
          
          if (retryCount >= maxRetries) {
            failedCount++;
            failedEmails.push(email);
            
            console.log(`💀 [CAMPAIGN] Max retries reached for ${email}, marking as permanently failed`);
            
            // Mark as permanently failed in tracking
            await this.emailTrackingService.markAsPermanentlyFailed((trackingRecord as any)._id.toString(), error);
            console.log(`✅ [CAMPAIGN] Email marked as permanently failed in tracking for ${email}`);
            
          } else {
            console.log(`🔄 [CAMPAIGN] Scheduling retry for ${email} in 5 minutes`);
            
            // Mark as failed and schedule retry
            await this.emailTrackingService.markAsFailed((trackingRecord as any)._id.toString(), error);
            await this.emailTrackingService.scheduleRetry((trackingRecord as any)._id.toString(), 5); // 5 minutes delay
            console.log(`✅ [CAMPAIGN] Retry scheduled for ${email}`);
            
            // Wait before retry
            console.log(`⏳ [CAMPAIGN] Waiting 1 second before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Update campaign progress
      console.log(`📊 [CAMPAIGN] Updating campaign progress - Sent: ${sentCount}, Failed: ${failedCount}`);
      await this.campaignModel.findByIdAndUpdate(campaignId, {
        sentCount,
        failedCount,
        sentEmails,
        failedEmails
      });

      // Wait before sending next email (rate limiting)
      if (i < recipientEmails.length - 1) {
        console.log(`⏳ [CAMPAIGN] Rate limiting: waiting ${sendInterval} seconds before next email...`);
        await new Promise(resolve => setTimeout(resolve, sendInterval * 1000));
      }
    }

    // Mark campaign as completed
    console.log(`🏁 [CAMPAIGN] Marking campaign ${campaignId} as completed`);
    await this.campaignModel.findByIdAndUpdate(campaignId, {
      status: CampaignStatus.COMPLETED,
      completedAt: new Date()
    });

    console.log(`🎉 [CAMPAIGN] Campaign ${campaignId} completed. Final stats - Sent: ${sentCount}, Failed: ${failedCount}`);
    console.log(`📧 [CAMPAIGN] Sent emails:`, sentEmails);
    console.log(`❌ [CAMPAIGN] Failed emails:`, failedEmails);
  }

  /**
   * Get failed emails for a campaign
   */
  async getFailedEmails(campaignId: string): Promise<any[]> {
    const failedEmails = await this.emailTrackingService.getFailedEmails(campaignId);
    return failedEmails.map(email => ({
      _id: (email as any)._id.toString(),
      recipientEmail: email.recipientEmail,
      subject: email.subject,
      status: email.status,
      failureReason: email.failureReason,
      errorMessage: email.errorMessage,
      retryCount: email.retryCount,
      failedAt: email.failedAt,
      smtpResponse: email.smtpResponse
    }));
  }

  /**
   * Retry failed emails for a campaign
   */
  async retryFailedEmails(campaignId: string, userId: string, userEmail: string): Promise<{ message: string; retryCount: number }> {
    const failedEmails = await this.emailTrackingService.getFailedEmails(campaignId);
    
    if (failedEmails.length === 0) {
      throw new BadRequestException('No failed emails found for this campaign');
    }

    let retryCount = 0;
    for (const emailTracking of failedEmails) {
      try {
        // Reset the tracking record for retry
        await this.emailTrackingService.scheduleRetry((emailTracking as any)._id.toString(), 1); // 1 minute delay
        retryCount++;
      } catch (error) {
        console.error(`Failed to schedule retry for ${emailTracking.recipientEmail}:`, error);
      }
    }

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Campaign Retry Failed Emails',
      entity: 'Campaign',
      entityId: campaignId,
      entityName: `Retry ${retryCount} failed emails`,
      userId: userId,
      userEmail: userEmail,
      type: 'update'
    });

    return { 
      message: `Scheduled ${retryCount} failed emails for retry`,
      retryCount 
    };
  }

  /**
   * Get detailed campaign statistics with email tracking
   */
  async getDetailedCampaignStats(campaignId: string): Promise<any> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const emailStats = await this.emailTrackingService.getCampaignStats(campaignId);
    
    return {
      campaign: this.mapToResponseDto(campaign),
      emailStats,
      failureRate: emailStats.total > 0 ? ((emailStats.failed + emailStats.permanentlyFailed) / emailStats.total) * 100 : 0
    };
  }

  /**
   * Test email failure scenario
   */
  async testEmailFailure(email: string, subject: string, content: string): Promise<void> {
    console.log(`🧪 [TEST] Testing email failure for: ${email}`);
    
    let trackingRecord: any;
    
    try {
      // Create a tracking record
      trackingRecord = await this.emailTrackingService.createTrackingRecord({
        campaignId: '000000000000000000000000', // Dummy campaign ID
        recipientEmail: email,
        subject: subject,
        maxRetries: 3,
        createdBy: 'test',
        createdByEmail: 'test@test.com',
        metadata: {
          campaignName: 'Test Campaign',
          isTest: true
        }
      });

      console.log(`🧪 [TEST] Tracking record created: ${trackingRecord._id}`);

      // Try to send the email
      await this.mailService.sendCampaignEmail(email, subject, content);
      
      console.log(`🧪 [TEST] Email sent successfully (unexpected)`);
      await this.emailTrackingService.markAsSent(trackingRecord._id.toString());
      
    } catch (error) {
      console.log(`🧪 [TEST] Email failed as expected:`, error);
      if (trackingRecord) {
        await this.emailTrackingService.markAsFailed(trackingRecord._id.toString(), error);
      }
      throw error; // Re-throw to show the failure
    }
  }

  /**
   * Debug email tracking data
   */
  async debugEmailTracking(): Promise<any> {
    console.log(`🔍 [DEBUG] Fetching email tracking debug data...`);
    
    // Get all email tracking records
    const allRecords = await this.emailTrackingService.getAllTrackingRecords();
    
    // Get statistics
    const stats = await this.emailTrackingService.getGlobalStats();
    
    // Get failed emails
    const failedEmails = await this.emailTrackingService.getAllFailedEmails();
    
    return {
      totalRecords: allRecords.length,
      statistics: stats,
      allRecords: allRecords.map(record => ({
        id: (record as any)._id,
        email: record.recipientEmail,
        status: record.status,
        failureReason: record.failureReason,
        errorMessage: record.errorMessage,
        retryCount: record.retryCount,
        createdAt: (record as any).createdAt,
        sentAt: record.sentAt,
        failedAt: record.failedAt
      })),
      failedEmails: failedEmails.map(record => ({
        id: record._id,
        email: record.recipientEmail,
        status: record.status,
        failureReason: record.failureReason,
        errorMessage: record.errorMessage,
        retryCount: record.retryCount,
        failedAt: record.failedAt
      }))
    };
  }

  /**
   * Simulate a bounce for testing
   */
  async simulateBounce(bounceData: {
    email: string;
    bounceType: string;
    reason: string;
    smtpCode?: string;
  }): Promise<any> {
    console.log(`🧪 [BOUNCE] Simulating bounce for: ${bounceData.email}`);
    
    // Map string bounce type to enum
    let bounceType: BounceType;
    switch (bounceData.bounceType.toLowerCase()) {
      case 'hard_bounce':
        bounceType = BounceType.HARD_BOUNCE;
        break;
      case 'soft_bounce':
        bounceType = BounceType.SOFT_BOUNCE;
        break;
      case 'blocked':
        bounceType = BounceType.BLOCKED;
        break;
      case 'spam':
        bounceType = BounceType.SPAM;
        break;
      case 'unsubscribed':
        bounceType = BounceType.UNSUBSCRIBED;
        break;
      case 'invalid_email':
        bounceType = BounceType.INVALID_EMAIL;
        break;
      default:
        bounceType = BounceType.HARD_BOUNCE;
    }

    // Process the bounce
    await this.emailBounceService.processBounce({
      recipientEmail: bounceData.email,
      bounceType: bounceType,
      reason: bounceData.reason,
      smtpCode: bounceData.smtpCode,
      smtpMessage: bounceData.reason
    });

    // Get updated tracking data
    const trackingRecord = await this.emailTrackingService.findByEmail(bounceData.email);
    const bounceStats = await this.emailBounceService.getBounceStats();

    return {
      message: `Bounce simulated for ${bounceData.email}`,
      bounceType: bounceType,
      trackingRecord: trackingRecord ? {
        id: (trackingRecord as any)._id,
        email: trackingRecord.recipientEmail,
        status: trackingRecord.status,
        failureReason: trackingRecord.failureReason,
        errorMessage: trackingRecord.errorMessage
      } : null,
      bounceStats
    };
  }

  /**
   * Map campaign document to response DTO
   */
  private mapToResponseDto(campaign: CampaignDocument): CampaignResponseDto {
    const campaignDoc = campaign as any;
    return {
      _id: campaignDoc._id.toString(),
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      type: campaign.type,
      status: campaign.status,
      scheduledAt: campaign.scheduledAt,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      openedCount: campaign.openedCount,
      clickedCount: campaign.clickedCount,
      recipientEmails: campaign.recipientEmails,
      sentEmails: campaign.sentEmails,
      failedEmails: campaign.failedEmails,
      settings: campaign.settings,
      createdBy: campaign.createdBy?.toString(),
      createdByEmail: campaign.createdByEmail,
      notes: campaign.notes,
      metadata: campaign.metadata,
      createdAt: campaignDoc.createdAt,
      updatedAt: campaignDoc.updatedAt
    };
  }

  /**
   * Test SendGrid connection
   */
  async testSendGridConnection(): Promise<boolean> {
    console.log(`🧪 [CAMPAIGN] Testing SendGrid connection...`);
    
    try {
      const isConnected = await this.sendGridService.testConnection();
      console.log(`✅ [CAMPAIGN] SendGrid connection test result: ${isConnected}`);
      return isConnected;
    } catch (error) {
      console.error(`❌ [CAMPAIGN] SendGrid connection test failed:`, error);
      return false;
    }
  }
} 