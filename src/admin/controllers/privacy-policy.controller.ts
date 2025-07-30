import { Controller, Get, Patch, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { PrivacyPolicyService } from '../services/privacy-policy.service';
import { UpdatePrivacyPolicyDto } from '../enums/privacy-policy.dto';
import { AdminSuccessResponse } from '../enums/response';
import { AdminMessages } from '../enums/messages';

@Controller('admin/privacy-policy')
export class PrivacyPolicyController {
  constructor(private readonly privacyPolicyService: PrivacyPolicyService) {}

  /**
   * GET /admin/privacy-policy
   * Get Privacy Policy information
   */
  @Get()
  async get() {
    const privacyPolicy = await this.privacyPolicyService.get();
    return new AdminSuccessResponse(AdminMessages.PRIVACY_POLICY_FETCHED_SUCCESS, privacyPolicy);
  }

  /**
   * PATCH /admin/privacy-policy
   * Update Privacy Policy information (creates if doesn't exist)
   */
  @Patch()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Body() dto: UpdatePrivacyPolicyDto) {
    const privacyPolicy = await this.privacyPolicyService.update(dto);
    return new AdminSuccessResponse(AdminMessages.PRIVACY_POLICY_UPDATED_SUCCESS, privacyPolicy);
  }
} 