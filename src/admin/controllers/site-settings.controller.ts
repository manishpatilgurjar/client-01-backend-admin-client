import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  Req
} from '@nestjs/common';
import { SiteSettingsService } from '../services/site-settings.service';
import { 
  CreateSiteSettingsDto, 
  UpdateSiteSettingsDto, 
  SiteSettingsResponseDto 
} from '../enums/site-settings.dto';
import { AdminAuthMiddleware } from '../middleware/auth.middleware';

@Controller('admin/site-settings')
@UseGuards(AdminAuthMiddleware)
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  /**
   * Get all site settings
   */
  @Get()
  async getAllSiteSettings(): Promise<{
    success: boolean;
    message: string;
    data: SiteSettingsResponseDto[];
  }> {
    const settings = await this.siteSettingsService.getAllSiteSettings();
    
    return {
      success: true,
      message: 'Site settings retrieved successfully',
      data: settings
    };
  }

  /**
   * Get main site settings
   */
  @Get('main')
  async getMainSiteSettings(): Promise<{
    success: boolean;
    message: string;
    data: SiteSettingsResponseDto;
  }> {
    const settings = await this.siteSettingsService.getMainSiteSettings();
    
    return {
      success: true,
      message: 'Main site settings retrieved successfully',
      data: settings
    };
  }

  /**
   * Get site settings by key
   */
  @Get(':key')
  async getSiteSettingsByKey(@Param('key') key: string): Promise<{
    success: boolean;
    message: string;
    data: SiteSettingsResponseDto;
  }> {
    const settings = await this.siteSettingsService.getSiteSettingsByKey(key);
    
    return {
      success: true,
      message: 'Site settings retrieved successfully',
      data: settings
    };
  }

  /**
   * Create new site settings
   */
  @Post()
  async createSiteSettings(
    @Body() dto: CreateSiteSettingsDto,
    @Req() req: any
  ): Promise<{
    success: boolean;
    message: string;
    data: SiteSettingsResponseDto;
  }> {
    const userEmail = req.user?.email;
    const settings = await this.siteSettingsService.createSiteSettings(dto, userEmail);
    
    return {
      success: true,
      message: 'Site settings created successfully',
      data: settings
    };
  }

  /**
   * Update site settings
   */
  @Put(':key')
  async updateSiteSettings(
    @Param('key') key: string,
    @Body() dto: UpdateSiteSettingsDto,
    @Req() req: any
  ): Promise<{
    success: boolean;
    message: string;
    data: SiteSettingsResponseDto;
  }> {
    const userEmail = req.user?.email;
    const settings = await this.siteSettingsService.updateSiteSettings(key, dto, userEmail);
    
    return {
      success: true,
      message: 'Site settings updated successfully',
      data: settings
    };
  }

  /**
   * Delete site settings
   */
  @Delete(':key')
  async deleteSiteSettings(
    @Param('key') key: string,
    @Req() req: any
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const userEmail = req.user?.email;
    const result = await this.siteSettingsService.deleteSiteSettings(key, userEmail);
    
    return {
      success: true,
      message: result.message
    };
  }

  /**
   * Initialize default settings
   */
  @Post('initialize')
  async initializeDefaultSettings(): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.siteSettingsService.initializeDefaultSettings();
    
    return {
      success: true,
      message: 'Default site settings initialized successfully'
    };
  }
} 