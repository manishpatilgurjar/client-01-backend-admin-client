import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument, CampaignStatus, CampaignType } from '../models/campaign.schema';
import { CreateCampaignDto, UpdateCampaignDto, CampaignResponseDto, CampaignStatsDto, RunCampaignDto } from '../enums/campaign.dto';
import { MailService } from '../../mail/mail.service';
import { EnquiryModel } from '../models/enquiry.schema';
import { ActivityLogService } from './activity-log.service';

@Injectable()
export class CampaignService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    private readonly mailService: MailService,
    private readonly activityLogService: ActivityLogService
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
    const [
      totalCampaigns,
      draftCampaigns,
      scheduledCampaigns,
      runningCampaigns,
      completedCampaigns,
      failedCampaigns,
      totalEmailsSent,
      totalEmailsFailed
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
      ])
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

    return {
      totalCampaigns,
      draftCampaigns,
      scheduledCampaigns,
      runningCampaigns,
      completedCampaigns,
      failedCampaigns,
      totalEmailsSent: totalSent,
      totalEmailsFailed: totalFailed,
      averageOpenRate: totalSent > 0 ? (totalOpenedCount / totalSent) * 100 : 0,
      averageClickRate: totalSent > 0 ? (totalClickedCount / totalSent) * 100 : 0
    };
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
   * Send campaign emails (background process)
   */
  private async sendCampaignEmails(campaignId: string, recipientEmails: string[]): Promise<void> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) {
      console.error(`Campaign ${campaignId} not found`);
      return;
    }

    const sendInterval = campaign.settings?.sendInterval || 2;
    const maxRetries = campaign.settings?.maxRetries || 3;
    let sentCount = 0;
    let failedCount = 0;
    const sentEmails: string[] = [];
    const failedEmails: string[] = [];

    console.log(`Starting campaign ${campaignId} with ${recipientEmails.length} recipients`);

    for (let i = 0; i < recipientEmails.length; i++) {
      const email = recipientEmails[i];
      let retryCount = 0;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          // Send email using mail service
          await this.mailService.sendCampaignEmail(email, campaign.subject, campaign.content);
          success = true;
          sentCount++;
          sentEmails.push(email);
          console.log(`Email sent successfully to ${email}`);
        } catch (error) {
          retryCount++;
          console.error(`Failed to send email to ${email} (attempt ${retryCount}):`, error);
          
          if (retryCount >= maxRetries) {
            failedCount++;
            failedEmails.push(email);
            console.error(`Email failed permanently for ${email}`);
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Update campaign progress
      await this.campaignModel.findByIdAndUpdate(campaignId, {
        sentCount,
        failedCount,
        sentEmails,
        failedEmails
      });

      // Wait before sending next email (rate limiting)
      if (i < recipientEmails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, sendInterval * 1000));
      }
    }

    // Mark campaign as completed
    await this.campaignModel.findByIdAndUpdate(campaignId, {
      status: CampaignStatus.COMPLETED,
      completedAt: new Date()
    });

    console.log(`Campaign ${campaignId} completed. Sent: ${sentCount}, Failed: ${failedCount}`);
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
} 