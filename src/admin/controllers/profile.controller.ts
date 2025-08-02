import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  UseInterceptors,
  UploadedFile,
  UsePipes,
  ValidationPipe,
  Query,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { 
  UpdateProfileDto, 
  ChangePasswordDto, 
  RequestPasswordResetDto, 
  ResetPasswordDto, 
  VerifyOTPDto, 
  UpdatePreferencesDto,
  EnableTwoFactorDto,
  DisableTwoFactorDto
} from '../enums/profile.dto';
import { AdminSuccessResponse } from '../enums/response';
import { FileUploadInterceptor } from '../../common/interceptors/file-upload.interceptor';

@Controller('admin/users/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * GET /admin/users/profile
   * Get user profile
   */
  @Get()
  async getProfile(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const profile = await this.profileService.getProfile(userId);
    return new AdminSuccessResponse('Profile retrieved successfully', profile);
  }

  /**
   * PUT /admin/users/profile
   * Update user profile
   */
  @Put()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateProfile(@Query('userId') userId: string, @Body() dto: UpdateProfileDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    // Get user email from the user ID
    const user = await this.profileService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const profile = await this.profileService.updateProfile(userId, dto, user.email);
    return new AdminSuccessResponse('Profile updated successfully', profile);
  }

  /**
   * POST /admin/users/profile/avatar
   * Upload avatar
   */
  @Post('avatar')
  @UseInterceptors(FileUploadInterceptor)
  async uploadAvatar(@Query('userId') userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    if (!file) {
      throw new BadRequestException('No file uploaded. Please select an image file.');
    }
    
    // Get user email from the user ID
    const user = await this.profileService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const result = await this.profileService.uploadAvatar(userId, file, user.email);
    return new AdminSuccessResponse('Avatar uploaded successfully', result);
  }

  /**
   * PUT /admin/users/profile/password
   * Change password (step 1: send OTP)
   */
  @Put('password')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async changePassword(@Query('userId') userId: string, @Body() dto: ChangePasswordDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    // Get user email from the user ID
    const user = await this.profileService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const result = await this.profileService.changePassword(userId, dto, user.email);
    return new AdminSuccessResponse(result.message);
  }

  /**
   * POST /admin/users/profile/password/verify-otp
   * Verify OTP and change password (step 2: verify OTP)
   */
  @Post('password/verify-otp')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async verifyOTPAndChangePassword(@Query('userId') userId: string, @Body() dto: VerifyOTPDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    // Get user email from the user ID
    const user = await this.profileService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const result = await this.profileService.verifyOTPAndChangePassword(userId, dto, user.email);
    return new AdminSuccessResponse(result.message);
  }

  /**
   * POST /admin/users/profile/password/reset-request
   * Request password reset (public endpoint)
   */
  @Post('password/reset-request')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    const result = await this.profileService.requestPasswordReset(dto);
    return new AdminSuccessResponse(result.message);
  }

  /**
   * POST /admin/users/profile/password/reset
   * Reset password with token (public endpoint)
   */
  @Post('password/reset')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.profileService.resetPassword(dto);
    return new AdminSuccessResponse(result.message);
  }

  /**
   * PUT /admin/users/profile/preferences
   * Update user preferences
   */
  @Put('preferences')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updatePreferences(@Query('userId') userId: string, @Body() dto: UpdatePreferencesDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    // Get user email from the user ID
    const user = await this.profileService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const profile = await this.profileService.updatePreferences(userId, dto, user.email);
    return new AdminSuccessResponse('Preferences updated successfully', profile);
  }

  /**
   * GET /admin/users/profile/activity
   * Get user activity
   */
  @Get('activity')
  async getUserActivity(@Query('userId') userId: string, @Query('limit') limit?: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    const limitNumber = limit ? parseInt(limit) : 10;
    const activities = await this.profileService.getUserActivity(userId, limitNumber);
    return new AdminSuccessResponse('User activity retrieved successfully', activities);
  }

  @Post('2fa/setup')
  async requestTwoFactorSetup(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const user = await this.profileService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const result = await this.profileService.requestTwoFactorSetup(userId, user.email);
    return new AdminSuccessResponse(result.message);
  }

  @Post('2fa/enable')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async enableTwoFactor(@Query('userId') userId: string, @Body() dto: EnableTwoFactorDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const user = await this.profileService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const result = await this.profileService.enableTwoFactor(userId, dto, user.email);
    return new AdminSuccessResponse(result.message);
  }

  @Post('2fa/disable')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async disableTwoFactor(@Query('userId') userId: string, @Body() dto: DisableTwoFactorDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const user = await this.profileService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const result = await this.profileService.disableTwoFactor(userId, dto, user.email);
    return new AdminSuccessResponse(result.message);
  }
} 