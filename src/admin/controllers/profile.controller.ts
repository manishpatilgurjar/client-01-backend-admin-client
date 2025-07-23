import { Controller, Get, HttpCode, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminSuccessResponse } from '../enums/response';
import { AdminMessages } from '../enums/messages';
import { ResponseCodes } from 'src/enum/responseCodes';
import { AdminUserModel } from '../models/user.schema';

/**
 * Controller for admin profile endpoints.
 * Requires authentication via AdminAuthMiddleware (set up in the module).
 */
@Controller('admin')
export class ProfileController {
  /**
   * GET /admin/profile
   * Returns the authenticated admin's full profile details.
   * Requires a valid access token in the Authorization header.
   */
  @Get('profile')
  @HttpCode(ResponseCodes.SUCCESS)
  async getProfile(@Req() req: Request): Promise<AdminSuccessResponse> {
    // req.user is set by the middleware
    const userId = (req as any).user.id;
    // Fetch the full admin user document, excluding password and __v
    const user = await AdminUserModel.findById(userId, { password: 0, __v: 0 }).lean();
    return new AdminSuccessResponse(AdminMessages.PROFILE_FETCHED_SUCCESS, user);
  }
} 