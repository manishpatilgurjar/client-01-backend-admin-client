import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SiteSettings, SiteSettingsModel } from '../models/site-settings.schema';
import { 
  CreateSiteSettingsDto, 
  UpdateSiteSettingsDto, 
  SiteSettingsResponseDto 
} from '../enums/site-settings.dto';
import { ActivityLogService } from './activity-log.service';

@Injectable()
export class SiteSettingsService {
  constructor(
    private readonly activityLogService: ActivityLogService
  ) {}

  /**
   * Get all site settings
   */
  async getAllSiteSettings(): Promise<SiteSettingsResponseDto[]> {
    const settings = await SiteSettingsModel.find({ isActive: true }).lean();
    
    return settings.map(setting => ({
      id: (setting._id as any).toString(),
      key: setting.key,
      siteName: setting.siteName,
      siteUrl: setting.siteUrl,
      siteDescription: setting.siteDescription,
      businessEmail: setting.businessEmail,
      adminEmail: setting.adminEmail,
      timezone: setting.timezone,
      contactNumber: setting.contactNumber,
      businessAddress: setting.businessAddress || '',
      businessHours: setting.businessHours || '',
      socialMedia: setting.socialMedia || {},
      logoUrl: setting.logoUrl || '',
      faviconUrl: setting.faviconUrl || '',
      isActive: setting.isActive,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt
    }));
  }

  /**
   * Get site settings by key
   */
  async getSiteSettingsByKey(key: string): Promise<SiteSettingsResponseDto> {
    const settings = await SiteSettingsModel.findOne({ key, isActive: true }).lean();
    
    if (!settings) {
      throw new NotFoundException('Site settings not found');
    }

    return {
      id: (settings._id as any).toString(),
      key: settings.key,
      siteName: settings.siteName,
      siteUrl: settings.siteUrl,
      siteDescription: settings.siteDescription,
      businessEmail: settings.businessEmail,
      adminEmail: settings.adminEmail,
      timezone: settings.timezone,
      contactNumber: settings.contactNumber,
      businessAddress: settings.businessAddress || '',
      businessHours: settings.businessHours || '',
      socialMedia: settings.socialMedia || {},
      logoUrl: settings.logoUrl || '',
      faviconUrl: settings.faviconUrl || '',
      isActive: settings.isActive,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };
  }

  /**
   * Get main site settings (default)
   */
  async getMainSiteSettings(): Promise<SiteSettingsResponseDto> {
    return this.getSiteSettingsByKey('main');
  }

  /**
   * Create new site settings
   */
  async createSiteSettings(dto: CreateSiteSettingsDto, userEmail?: string): Promise<SiteSettingsResponseDto> {
    // Check if settings with the same key already exists
    const existingSettings = await SiteSettingsModel.findOne({ key: dto.key || 'main' });
    if (existingSettings) {
      throw new BadRequestException('Site settings with this key already exists');
    }

    const settings = await SiteSettingsModel.create({
      key: dto.key || 'main',
      siteName: dto.siteName,
      siteUrl: dto.siteUrl,
      siteDescription: dto.siteDescription,
      businessEmail: dto.businessEmail,
      adminEmail: dto.adminEmail,
      timezone: dto.timezone,
      contactNumber: dto.contactNumber,
      businessAddress: dto.businessAddress || '',
      businessHours: dto.businessHours || '',
      socialMedia: dto.socialMedia || {},
      logoUrl: dto.logoUrl || '',
      faviconUrl: dto.faviconUrl || '',
      isActive: dto.isActive !== undefined ? dto.isActive : true
    });

    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Site Settings Created',
      entity: 'SiteSettings',
      entityId: (settings._id as any).toString(),
      entityName: dto.siteName,
      userId: 'system',
      userEmail: userEmail || 'system',
      type: 'create'
    });

    return this.getSiteSettingsByKey(settings.key);
  }

  /**
   * Update site settings
   */
  async updateSiteSettings(key: string, dto: UpdateSiteSettingsDto, userEmail?: string): Promise<SiteSettingsResponseDto> {
    const settings = await SiteSettingsModel.findOne({ key, isActive: true });
    
    if (!settings) {
      throw new NotFoundException('Site settings not found');
    }

    // Update fields
    if (dto.siteName !== undefined) settings.siteName = dto.siteName;
    if (dto.siteUrl !== undefined) settings.siteUrl = dto.siteUrl;
    if (dto.siteDescription !== undefined) settings.siteDescription = dto.siteDescription;
    if (dto.businessEmail !== undefined) settings.businessEmail = dto.businessEmail;
    if (dto.adminEmail !== undefined) settings.adminEmail = dto.adminEmail;
    if (dto.timezone !== undefined) settings.timezone = dto.timezone;
    if (dto.contactNumber !== undefined) settings.contactNumber = dto.contactNumber;
    if (dto.businessAddress !== undefined) settings.businessAddress = dto.businessAddress;
    if (dto.businessHours !== undefined) settings.businessHours = dto.businessHours;
    if (dto.socialMedia !== undefined) settings.socialMedia = dto.socialMedia;
    if (dto.logoUrl !== undefined) settings.logoUrl = dto.logoUrl;
    if (dto.faviconUrl !== undefined) settings.faviconUrl = dto.faviconUrl;
    if (dto.isActive !== undefined) settings.isActive = dto.isActive;

    settings.updatedAt = new Date();
    await settings.save();

    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Site Settings Updated',
      entity: 'SiteSettings',
      entityId: (settings._id as any).toString(),
      entityName: settings.siteName,
      userId: 'system',
      userEmail: userEmail || 'system',
      type: 'update'
    });

    return this.getSiteSettingsByKey(key);
  }

  /**
   * Delete site settings
   */
  async deleteSiteSettings(key: string, userEmail?: string): Promise<{ message: string }> {
    const settings = await SiteSettingsModel.findOne({ key, isActive: true });
    
    if (!settings) {
      throw new NotFoundException('Site settings not found');
    }

    // Soft delete by setting isActive to false
    settings.isActive = false;
    settings.updatedAt = new Date();
    await settings.save();

    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Site Settings Deleted',
      entity: 'SiteSettings',
      entityId: (settings._id as any).toString(),
      entityName: settings.siteName,
      userId: 'system',
      userEmail: userEmail || 'system',
      type: 'delete'
    });

    return { message: 'Site settings deleted successfully' };
  }

  /**
   * Initialize default site settings if none exist
   */
  async initializeDefaultSettings(): Promise<void> {
    const existingSettings = await SiteSettingsModel.findOne({ key: 'main' });
    
    if (!existingSettings) {
      await SiteSettingsModel.create({
        key: 'main',
        siteName: 'Your Company Name',
        siteUrl: 'https://yourcompany.com',
        siteDescription: 'Your company description',
        businessEmail: 'info@yourcompany.com',
        adminEmail: 'admin@yourcompany.com',
        timezone: 'UTC',
        contactNumber: '+1234567890',
        businessAddress: '',
        businessHours: '',
        socialMedia: {},
        logoUrl: '',
        faviconUrl: '',
        isActive: true
      });
    }
  }

  /**
   * Get settings for email templates
   */
  async getEmailSettings(): Promise<{
    siteName: string;
    siteUrl: string;
    businessEmail: string;
    contactNumber: string;
    businessAddress: string;
  }> {
    const settings = await this.getMainSiteSettings();
    
    return {
      siteName: settings.siteName,
      siteUrl: settings.siteUrl,
      businessEmail: settings.businessEmail,
      contactNumber: settings.contactNumber,
      businessAddress: settings.businessAddress
    };
  }
} 