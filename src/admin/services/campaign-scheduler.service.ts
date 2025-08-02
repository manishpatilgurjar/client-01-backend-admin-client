import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampaignService } from './campaign.service';
import { CampaignStatus, CampaignDocument } from '../models/campaign.schema';

interface ScheduledCampaign {
  id: string;
  name: string;
  scheduledAt: Date;
  timer?: NodeJS.Timeout;
}

@Injectable()
export class CampaignSchedulerService {
  private readonly logger = new Logger(CampaignSchedulerService.name);
  private lastCheckDate: string = '';
  private scheduledCampaigns: Map<string, ScheduledCampaign> = new Map();
  private isInitialized = false;

  constructor(private readonly campaignService: CampaignService) {}

  /**
   * Check for scheduled campaigns once per day at 3:40 AM
   * This significantly reduces database hits from 1440 per day to 1 per day
   */
  @Cron('40 3 * * *') // Run at 3:40 AM every day
  async handleScheduledCampaigns() {
    try {
      const today = new Date().toDateString();
      
      // Skip if we already checked today
      if (this.lastCheckDate === today) {
        this.logger.log('Already checked campaigns today, skipping...');
        return;
      }

      this.logger.log('Daily campaign scheduler check started...');
      
      // Clear existing timers for the new day
      this.clearAllTimers();
      
      // Get all campaigns scheduled for today and future dates
      const campaigns = await this.getScheduledCampaignsForDay();
      
      if (campaigns.length === 0) {
        this.logger.log('No scheduled campaigns found for today');
        this.lastCheckDate = today;
        return;
      }

      this.logger.log(`Found ${campaigns.length} scheduled campaigns for today`);

      // Schedule each campaign with individual timers
      for (const campaign of campaigns) {
        this.scheduleCampaign(campaign);
      }

      this.lastCheckDate = today;
      this.isInitialized = true;
      
    } catch (error) {
      this.logger.error('Error in campaign scheduler:', error);
    }
  }

  /**
   * Schedule a single campaign with a timer
   */
  private scheduleCampaign(campaign: CampaignDocument): void {
    const campaignId = (campaign as any)._id.toString();
    const scheduledAt = campaign.scheduledAt;
    
    if (!scheduledAt) {
      this.logger.warn(`Campaign ${campaignId} has no scheduledAt date`);
      return;
    }

    const now = new Date();
    const timeUntilRun = scheduledAt.getTime() - now.getTime();

    // If the scheduled time has already passed, run immediately
    if (timeUntilRun <= 0) {
      this.logger.log(`Campaign ${campaign.name} scheduled time has passed, running immediately`);
      this.runScheduledCampaign(campaignId);
      return;
    }

    // Schedule the campaign to run at its exact time
    const timer = setTimeout(() => {
      this.logger.log(`Timer triggered for campaign: ${campaign.name}`);
      this.runScheduledCampaign(campaignId);
      // Remove from scheduled campaigns after execution
      this.scheduledCampaigns.delete(campaignId);
    }, timeUntilRun);

    // Store the campaign and timer
    this.scheduledCampaigns.set(campaignId, {
      id: campaignId,
      name: campaign.name,
      scheduledAt: scheduledAt,
      timer: timer
    });

    const hoursUntilRun = Math.floor(timeUntilRun / (1000 * 60 * 60));
    const minutesUntilRun = Math.floor((timeUntilRun % (1000 * 60 * 60)) / (1000 * 60));
    
    this.logger.log(`Scheduled campaign "${campaign.name}" to run in ${hoursUntilRun}h ${minutesUntilRun}m (at ${scheduledAt.toLocaleString()})`);
  }

  /**
   * Get scheduled campaigns for the entire day (more efficient than checking every minute)
   */
  private async getScheduledCampaignsForDay(): Promise<CampaignDocument[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    return this.campaignService.getScheduledCampaignsForDateRange(startOfDay, endOfDay);
  }

  /**
   * Clear all existing timers
   */
  private clearAllTimers(): void {
    this.logger.log(`Clearing ${this.scheduledCampaigns.size} existing timers`);
    
    for (const [campaignId, scheduledCampaign] of this.scheduledCampaigns) {
      if (scheduledCampaign.timer) {
        clearTimeout(scheduledCampaign.timer);
      }
    }
    
    this.scheduledCampaigns.clear();
  }

  /**
   * Run a scheduled campaign
   */
  private async runScheduledCampaign(campaignId: string): Promise<void> {
    try {
      // Get the campaign to ensure it still exists and is still scheduled
      const campaign = await this.campaignService.getCampaignById(campaignId);
      
      if (!campaign || campaign.status !== CampaignStatus.SCHEDULED) {
        this.logger.log(`Campaign ${campaignId} is no longer scheduled or doesn't exist`);
        return;
      }

      this.logger.log(`Running scheduled campaign: ${campaign.name}`);

      // Run the campaign with empty custom emails (use enquiry emails)
      await this.campaignService.runCampaign(
        campaignId, 
        { customEmails: [] }, 
        campaign.createdBy, 
        campaign.createdByEmail
      );

      this.logger.log(`Successfully started scheduled campaign: ${campaign.name}`);
      
    } catch (error) {
      this.logger.error(`Failed to run scheduled campaign ${campaignId}:`, error);
      
      // Update campaign status to failed
      try {
        await this.campaignService.updateCampaign(
          campaignId,
          { 
            status: CampaignStatus.FAILED,
            metadata: {
              lastError: error.message,
              retryCount: 0
            }
          },
          'system',
          'system@example.com'
        );
      } catch (updateError) {
        this.logger.error(`Failed to update campaign status to failed:`, updateError);
      }
    }
  }

  /**
   * Manual method to check for scheduled campaigns (for testing)
   */
  async checkScheduledCampaigns() {
    this.logger.log('Manual check for scheduled campaigns...');
    await this.handleScheduledCampaigns();
  }

  /**
   * Get scheduler status
   */
  async getSchedulerStatus() {
    const today = new Date().toDateString();
    const isCheckedToday = this.lastCheckDate === today;
    
    // Get upcoming campaigns
    const upcomingCampaigns = Array.from(this.scheduledCampaigns.values())
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
      .map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        scheduledAt: campaign.scheduledAt,
        timeUntilRun: campaign.scheduledAt.getTime() - new Date().getTime()
      }));
    
    return {
      isRunning: true,
      isInitialized: this.isInitialized,
      lastCheck: this.lastCheckDate ? new Date(this.lastCheckDate) : null,
      checkedToday: isCheckedToday,
      scheduledCampaignsCount: this.scheduledCampaigns.size,
      upcomingCampaigns: upcomingCampaigns.slice(0, 5), // Show next 5 campaigns
      nextCheck: isCheckedToday ? 
        new Date(new Date().setDate(new Date().getDate() + 1)) : // Tomorrow at 1 AM
        new Date(new Date().setHours(1, 0, 0, 0)) // Today at 1 AM if not checked yet
    };
  }

  /**
   * Force refresh cache (useful for testing or when campaigns are added/updated)
   */
  async refreshCache() {
    this.logger.log('Refreshing campaign cache...');
    this.clearAllTimers();
    this.lastCheckDate = '';
    this.isInitialized = false;
    
    // Re-run the scheduler to pick up new campaigns
    await this.handleScheduledCampaigns();
  }


} 