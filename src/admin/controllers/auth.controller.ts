import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AdminLoginDto, RefreshTokenRequestDto, LogoutRequestDto, AdminLoginWithOTPDto } from '../enums/login.dto';
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
    console.log('🚀 [CONTROLLER] Login request received');
    console.log('📧 [CONTROLLER] Email:', dto.email);
    console.log('🔐 [CONTROLLER] Password provided:', dto.password ? 'YES' : 'NO');
    console.log('📱 [CONTROLLER] Device data:', dto.deviceData);
    
    try {
      console.log('🔄 [CONTROLLER] Calling auth service...');
      const result = await this.authService.login(dto);
      console.log('✅ [CONTROLLER] Auth service returned result');
      console.log('📋 [CONTROLLER] Result type:', typeof result);
      console.log('📋 [CONTROLLER] Result keys:', Object.keys(result));
      
      // If the result is an error, return it directly
      if (result instanceof AdminErrorResponse) {
        console.log('❌ [CONTROLLER] Returning error response');
        return result;
      }
      
      // Otherwise, return a standardized success response
      console.log('✅ [CONTROLLER] Creating success response');
      const response = new AdminSuccessResponse(AdminMessages.LOGIN_SUCCESS, result);
      console.log('✅ [CONTROLLER] Success response created');
      return response;
    } catch (error) {
      console.log('❌ [CONTROLLER] Error in login:', error.message);
      console.log('❌ [CONTROLLER] Error stack:', error.stack);
      throw error;
    }
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

  /**
   * POST /admin/auth/verify-2fa
   * Verifies 2FA OTP and completes login process.
   * @param dto - AdminLoginWithOTPDto containing the OTP
   * @param tempToken - Temporary token from step 1 login (in Authorization header)
   * @returns AdminSuccessResponse with tokens and user info
   */
  @Post('verify-2fa')
  @HttpCode(200)
  async verify2FA(@Body() dto: AdminLoginWithOTPDto, @Body('tempToken') tempToken: string): Promise<AdminSuccessResponse> {
    const result = await this.authService.verify2FAAndLogin(dto, tempToken);
    return new AdminSuccessResponse(AdminMessages.LOGIN_SUCCESS, result);
  }
} 