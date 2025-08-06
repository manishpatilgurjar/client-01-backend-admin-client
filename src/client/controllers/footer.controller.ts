import { 
  Controller, 
  Get 
} from '@nestjs/common';
import { ClientSiteSettingsService } from '../services/site-settings.service';
import { AdminSuccessResponse } from '../../admin/enums/response';

@Controller('api/client/footer')
export class ClientFooterController {
  constructor(private readonly siteSettingsService: ClientSiteSettingsService) {}

  /**
   * GET /api/client/footer
   * Get complete footer data (company info, contact details, address, social media)
   */
  @Get()
  async getFooterData() {
    const footerData = await this.siteSettingsService.getFooterData();
    return new AdminSuccessResponse('Footer data fetched successfully', footerData);
  }

  /**
   * GET /api/client/footer/contact
   * Get only contact details for footer
   */
  @Get('contact')
  async getFooterContactDetails() {
    const footerData = await this.siteSettingsService.getFooterData();
    return new AdminSuccessResponse('Footer contact details fetched successfully', {
      contactDetails: footerData.contactDetails,
      address: footerData.address
    });
  }

  /**
   * GET /api/client/footer/social
   * Get only social media links for footer
   */
  @Get('social')
  async getFooterSocialMedia() {
    const footerData = await this.siteSettingsService.getFooterData();
    return new AdminSuccessResponse('Footer social media links fetched successfully', {
      socialMedia: footerData.socialMedia
    });
  }

  /**
   * GET /api/client/footer/company
   * Get only company information for footer
   */
  @Get('company')
  async getFooterCompanyInfo() {
    const footerData = await this.siteSettingsService.getFooterData();
    return new AdminSuccessResponse('Footer company information fetched successfully', {
      companyInfo: footerData.companyInfo,
      links: footerData.links
    });
  }
} 