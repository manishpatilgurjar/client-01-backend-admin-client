import { 
  Controller, 
  Get, 
  Param 
} from '@nestjs/common';
import { ClientSiteSettingsService } from '../services/site-settings.service';
import { AdminSuccessResponse } from '../../admin/enums/response';

@Controller('api/client/site-settings')
export class ClientSiteSettingsController {
  constructor(private readonly siteSettingsService: ClientSiteSettingsService) {}

  /**
   * GET /api/client/site-settings
   * Get main site settings
   */
  @Get()
  async getSiteSettings() {
    const settings = await this.siteSettingsService.get();
    return new AdminSuccessResponse('Site settings fetched successfully', settings);
  }

  /**
   * GET /api/client/site-settings/all
   * Get all site settings
   */
  @Get('all')
  async getAllSiteSettings() {
    const settings = await this.siteSettingsService.getAll();
    return new AdminSuccessResponse('All site settings fetched successfully', settings);
  }

  /**
   * GET /api/client/site-settings/footer
   * Get footer data (company address, contact details, social media links)
   */
  @Get('footer')
  async getFooterData() {
    const footerData = await this.siteSettingsService.getFooterData();
    return new AdminSuccessResponse('Footer data fetched successfully', footerData);
  }

  /**
   * GET /api/client/site-settings/:key
   * Get site settings by key
   */
  @Get(':key')
  async getSiteSettingsByKey(@Param('key') key: string) {
    const settings = await this.siteSettingsService.getByKey(key);
    return new AdminSuccessResponse('Site settings fetched successfully', settings);
  }
} 