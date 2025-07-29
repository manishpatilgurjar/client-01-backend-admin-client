import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AdminLoginDto, RefreshTokenRequestDto, LogoutRequestDto } from '../enums/login.dto';
import { AdminSuccessResponse, AdminErrorResponse } from '../enums/response';
import { AdminMessages } from '../enums/messages';
// import { ResponseCodes } from 'src/enum/responseCodes';
// import { AdminMessages } from '../enums/messages';

/**
 * Controller for admin authentication endpoints.
 * Handles login and future auth-related routes for admin panel.
 */
@Controller('admin/auth')
export class AuthController {
  /**
   * Injects the AuthService to handle authentication logic.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /admin/auth/login
   * Handles admin login requests (email only).
   * @param dto - AdminLoginDto containing email and password
   * @returns AdminSuccessResponse with tokens and user info, or AdminErrorResponse on failure
   * @HttpCode(200) ensures the response status is always 200 OK
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: AdminLoginDto): Promise<AdminSuccessResponse | AdminErrorResponse> {
    const result = await this.authService.login(dto);
    // If the result is an error, return it directly
    if (result instanceof AdminErrorResponse) {
      return result;
    }
    // Otherwise, return a standardized success response
    return new AdminSuccessResponse(AdminMessages.LOGIN_SUCCESS, result);
  }

  /**
   * POST /admin/auth/refresh
   * Generates a new access token using a valid refresh token.
   * @param dto - RefreshTokenRequestDto containing the refresh token
   * @returns AdminSuccessResponse with new access token and user info
   */
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshTokenRequestDto): Promise<AdminSuccessResponse> {
    const result = await this.authService.refreshAccessToken(dto.refreshToken);
    return new AdminSuccessResponse(AdminMessages.ACCESS_TOKEN_REFRESHED, result);
  }

  /**
   * POST /admin/auth/logout
   * Handles admin logout by invalidating the refresh token.
   * @param dto - LogoutRequestDto containing the access token
   * @returns AdminSuccessResponse with logout success message
   */
  @Post('logout')
  @HttpCode(200)
  async logout(@Body() dto: LogoutRequestDto): Promise<AdminSuccessResponse> {
    const result = await this.authService.logout(dto.accessToken);
    return new AdminSuccessResponse(result.message, {});
  }
} 