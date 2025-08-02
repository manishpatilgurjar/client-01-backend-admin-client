import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UsePipes, 
  ValidationPipe
} from '@nestjs/common';
import { CampaignService } from '../services/campaign.service';
import { CampaignSchedulerService } from '../services/campaign-scheduler.service';
import { CreateCampaignDto, UpdateCampaignDto, RunCampaignDto } from '../enums/campaign.dto';
import { AdminSuccessResponse } from '../enums/response';
import { CampaignStatus } from '../models/campaign.schema';

@Controller('admin/campaigns')
export class CampaignController {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly campaignSchedulerService: CampaignSchedulerService
  ) {}

  /**
   * GET /admin/campaigns - Get All Campaigns
   */
  @Get()
  async getAllCampaigns(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: CampaignStatus
  ) {
    const result = await this.campaignService.getAllCampaigns(
      parseInt(page),
      parseInt(limit),
      status
    );
    return new AdminSuccessResponse('Campaigns fetched successfully', result);
  }

  /**
   * GET /admin/campaigns/stats - Get Campaign Statistics
   */
  @Get('stats')
  async getCampaignStats() {
    const stats = await this.campaignService.getCampaignStats();
    return new AdminSuccessResponse('Campaign statistics fetched successfully', stats);
  }

  /**
   * GET /admin/campaigns/:id - Get Single Campaign
   */
  @Get(':id')
  async getCampaignById(@Param('id') id: string) {
    const campaign = await this.campaignService.getCampaignById(id);
    return new AdminSuccessResponse('Campaign fetched successfully', campaign);
  }

  /**
   * POST /admin/campaigns - Create New Campaign
   */
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createCampaign(@Body() dto: CreateCampaignDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const campaign = await this.campaignService.createCampaign(dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('Campaign created successfully', campaign);
  }

  /**
   * PUT /admin/campaigns/:id - Update Campaign
   */
  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const campaign = await this.campaignService.updateCampaign(id, dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('Campaign updated successfully', campaign);
  }

  /**
   * DELETE /admin/campaigns/:id - Delete Campaign
   */
  @Delete(':id')
  async deleteCampaign(@Param('id') id: string) {
    // TODO: Get user info from JWT token when auth is implemented
    const result = await this.campaignService.deleteCampaign(id, 'admin', 'admin@example.com');
    return new AdminSuccessResponse(result.message);
  }

  /**
   * POST /admin/campaigns/:id/run - Run Campaign Immediately
   */
  @Post(':id/run')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async runCampaign(@Param('id') id: string, @Body() dto: RunCampaignDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const result = await this.campaignService.runCampaign(id, dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse(result.message, { campaignId: result.campaignId });
  }

  /**
   * POST /admin/campaigns/:id/cancel - Cancel Campaign
   */
  @Post(':id/cancel')
  async cancelCampaign(@Param('id') id: string) {
    // TODO: Get user info from JWT token when auth is implemented
    const result = await this.campaignService.cancelCampaign(id, 'admin', 'admin@example.com');
    return new AdminSuccessResponse(result.message);
  }

  /**
   * PATCH /admin/campaigns/:id/status - Update Campaign Status
   */
  @Patch(':id/status')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateCampaignStatus(@Param('id') id: string, @Body() body: { status: CampaignStatus }) {
    // TODO: Get user info from JWT token when auth is implemented
    const campaign = await this.campaignService.updateCampaign(id, { status: body.status }, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('Campaign status updated successfully', campaign);
  }

  /**
   * GET /admin/campaigns/scheduler/status - Get Scheduler Status
   */
  @Get('scheduler/status')
  async getSchedulerStatus() {
    const status = await this.campaignSchedulerService.getSchedulerStatus();
    return new AdminSuccessResponse('Scheduler status fetched successfully', status);
  }

  /**
   * POST /admin/campaigns/scheduler/refresh - Force Refresh Scheduler Cache
   */
  @Post('scheduler/refresh')
  async refreshSchedulerCache() {
    await this.campaignSchedulerService.refreshCache();
    return new AdminSuccessResponse('Scheduler cache refreshed successfully');
  }

  /**
   * POST /admin/campaigns/scheduler/check - Manual Check for Scheduled Campaigns
   */
  @Post('scheduler/check')
  async checkScheduledCampaigns() {
    await this.campaignSchedulerService.checkScheduledCampaigns();
    return new AdminSuccessResponse('Manual campaign check completed');
  }
} 