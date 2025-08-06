import { 
  Controller, 
  Get 
} from '@nestjs/common';
import { ClientPrivacyPolicyService } from '../services/privacy-policy.service';
import { AdminSuccessResponse } from '../../admin/enums/response';

@Controller('api/client/privacy-policy')
export class ClientPrivacyPolicyController {
  constructor(private readonly privacyPolicyService: ClientPrivacyPolicyService) {}

  /**
   * GET /api/client/privacy-policy
   * Get complete privacy policy for public viewing
   */
  @Get()
  async getPrivacyPolicy() {
    const privacyPolicy = await this.privacyPolicyService.getPrivacyPolicy();
    return new AdminSuccessResponse('Privacy policy fetched successfully', privacyPolicy);
  }

  /**
   * GET /api/client/privacy-policy/summary
   * Get privacy policy summary (title and last updated date only)
   */
  @Get('summary')
  async getPrivacyPolicySummary() {
    const summary = await this.privacyPolicyService.getPrivacyPolicySummary();
    return new AdminSuccessResponse('Privacy policy summary fetched successfully', summary);
  }

  /**
   * GET /api/client/privacy-policy/formatted
   * Get formatted privacy policy with sections for better display
   */
  @Get('formatted')
  async getFormattedPrivacyPolicy() {
    const formattedPolicy = await this.privacyPolicyService.getFormattedPrivacyPolicy();
    return new AdminSuccessResponse('Formatted privacy policy fetched successfully', formattedPolicy);
  }
} 