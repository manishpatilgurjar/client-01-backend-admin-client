import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AdminMessages } from '../enums/messages';
import { AdminUserModel } from '../models/user.schema';
import { PasswordResetModel } from '../models/password-reset.schema';
import { PasswordHistoryModel } from '../models/password-history.schema';
import { RefreshTokenModel } from '../models/refresh-token.schema';
import { 
  UpdateProfileDto, 
  ChangePasswordDto, 
  RequestPasswordResetDto, 
  ResetPasswordDto, 
  VerifyOTPDto, 
  UpdatePreferencesDto, 
  EnableTwoFactorDto,
  DisableTwoFactorDto,
  UserProfileResponse, 
  UserActivityResponse 
} from '../enums/profile.dto';
import { ActivityLogService } from './activity-log.service';
import { S3UploadService } from '../../common/services/s3-upload.service';
import { MailService } from '../../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly s3UploadService: S3UploadService,
    private readonly mailService: MailService
  ) {}

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      throw new NotFoundException(AdminMessages.USER_NOT_FOUND);
    }

    // Update last login time when profile is accessed
    user.lastLogin = new Date();
    await user.save();

    // Get last password change information
    const lastPasswordChange = await this.getLastPasswordChange(userId);

    return {
      id: (user._id as any).toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone,
      location: user.location,
      bio: user.bio,
      avatar: user.profilePic,
      role: user.role,
      joinDate: user.createdAt,
      lastLogin: user.lastLogin,
      lastLoginTime: user.lastLogin.toISOString(),
      joinDateFormatted: user.createdAt.toISOString(),
      lastPasswordChange: lastPasswordChange ? {
        changedAt: lastPasswordChange.changedAt,
        changedAtFormatted: lastPasswordChange.changedAt.toISOString(),
        changedBy: lastPasswordChange.changedBy,
        reason: lastPasswordChange.reason,
        timeAgo: this.getTimeAgo(lastPasswordChange.changedAt)
      } : undefined,
      isActive: user.isActive,
      twoFactorEnabled: user.twoFactorEnabled,
      permissions: user.permissions,
      preferences: user.preferences
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto, userEmail?: string): Promise<UserProfileResponse> {
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      throw new NotFoundException(AdminMessages.USER_NOT_FOUND);
    }

    // Check if email is being changed and if it's already taken
    if (dto.email !== user.email) {
      const existingUser = await AdminUserModel.findOne({ email: dto.email });
      if (existingUser) {
        throw new BadRequestException(AdminMessages.EMAIL_ALREADY_TAKEN);
      }
    }

    // Update profile fields
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.email = dto.email;
    user.phone = dto.phone;
    user.location = dto.location;
    user.bio = dto.bio;

    await user.save();

    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Profile Updated',
      entity: 'User',
      entityId: (user._id as any).toString(),
      entityName: `${user.firstName} ${user.lastName}`,
      userId: (user._id as any).toString(),
      userEmail: userEmail || user.email,
      type: 'update'
    });

    return this.getProfile(userId);
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(userId: string, file: Express.Multer.File, userEmail?: string): Promise<{ avatar: string; avatarUrl: string }> {
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      throw new NotFoundException(AdminMessages.USER_NOT_FOUND);
    }

    // Upload to S3
    const avatarUrl = await this.s3UploadService.uploadFile(file, 'avatars');
    
    // Update user profile
    user.profilePic = avatarUrl;
    await user.save();

    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Avatar Uploaded',
      entity: 'User',
      entityId: (user._id as any).toString(),
      entityName: `${user.firstName} ${user.lastName}`,
      userId: (user._id as any).toString(),
      userEmail: userEmail || user.email,
      type: 'update'
    });

    return {
      avatar: avatarUrl,
      avatarUrl: avatarUrl
    };
  }

  /**
   * Change password with two-step verification
   */
  async changePassword(userId: string, dto: ChangePasswordDto, userEmail?: string): Promise<{ message: string }> {
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      throw new NotFoundException(AdminMessages.USER_NOT_FOUND);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException(AdminMessages.CURRENT_PASSWORD_INCORRECT);
    }

    // Verify new password confirmation
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(AdminMessages.NEW_PASSWORD_MISMATCH);
    }

    // Generate OTP
    const otp = this.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await PasswordResetModel.create({
      email: user.email,
      token: crypto.randomBytes(32).toString('hex'),
      otp,
      otpExpiresAt,
      tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isUsed: false
    });

    // Send OTP email
     this.mailService.sendOTPEmail(user.email, otp);

    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Password Change OTP Sent',
      entity: 'User',
      entityId: (user._id as any).toString(),
      entityName: `${user.firstName} ${user.lastName}`,
      userId: (user._id as any).toString(),
      userEmail: userEmail || user.email,
      type: 'system'
    });

    return { message: 'OTP sent to your email for password change verification' };
  }

  /**
   * Verify OTP and change password
   */
  async verifyOTPAndChangePassword(userId: string, dto: VerifyOTPDto, userEmail?: string): Promise<{ message: string; sessionsDestroyed: number }> {
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      throw new NotFoundException(AdminMessages.USER_NOT_FOUND);
    }

    // Find valid OTP
    const passwordReset = await PasswordResetModel.findOne({
      email: user.email,
      otp: dto.otp,
      otpExpiresAt: { $gt: new Date() },
      isUsed: false
    });

    if (!passwordReset) {
      throw new BadRequestException(AdminMessages.INVALID_OR_EXPIRED_OTP);
    }

    // Mark OTP as used
    passwordReset.isUsed = true;
    await passwordReset.save();

    // Update password with the new password provided
    user.password = dto.newPassword; // This will be hashed by the pre-save hook
    await user.save();

    // Record password change in history
    const passwordChangeRecord = await this.recordPasswordChange(
      userId, 
      userEmail || user.email, 
      'change'
    );

    // Destroy all active sessions (logout from all devices)
    const sessionsDestroyed = await this.destroyAllSessions(userId);

    // Send confirmation email
    this.mailService.sendPasswordChangeConfirmation(
      user.email,
      passwordChangeRecord.changedAt,
      undefined, // IP address (can be added from request context)
      undefined, // User agent (can be added from request context)
      sessionsDestroyed.deletedCount
    );

    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Password Changed',
      entity: 'User',
      entityId: (user._id as any).toString(),
      entityName: `${user.firstName} ${user.lastName}`,
      userId: (user._id as any).toString(),
      userEmail: userEmail || user.email,
      type: 'update'
    });

    return { 
      message: 'Password changed successfully. You have been logged out from all devices for security.',
      sessionsDestroyed: sessionsDestroyed.deletedCount
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<{ message: string }> {
    const user = await AdminUserModel.findOne({ email: dto.email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token and OTP
    const token = crypto.randomBytes(32).toString('hex');
    const otp = this.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save reset token
    await PasswordResetModel.create({
      email: dto.email,
      token,
      otp,
      otpExpiresAt,
      tokenExpiresAt,
      isUsed: false
    });

    // Send reset email with token and OTP
    await this.mailService.sendPasswordResetEmail(dto.email, token, otp);

    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Password Reset Requested',
      entity: 'User',
      entityId: (user._id as any).toString(),
      entityName: `${user.firstName} ${user.lastName}`,
      userId: (user._id as any).toString(),
      userEmail: user.email,
      type: 'system'
    });

    return { message: 'Password reset link sent to your email' };
  }

  /**
   * Reset password with token and OTP
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string; sessionsDestroyed: number }> {
    // Verify password confirmation
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirmation do not match');
    }

    // Find valid reset token
    const passwordReset = await PasswordResetModel.findOne({
      token: dto.token,
      tokenExpiresAt: { $gt: new Date() },
      isUsed: false
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Find user
    const user = await AdminUserModel.findOne({ email: passwordReset.email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Mark token as used
    passwordReset.isUsed = true;
    await passwordReset.save();

    // Update password
    user.password = dto.password; // This will be hashed by the pre-save hook
    await user.save();

    // Record password change in history
    const passwordChangeRecord = await this.recordPasswordChange(
      (user._id as any).toString(), 
      user.email, 
      'reset'
    );

    // Destroy all active sessions (logout from all devices)
    const sessionsDestroyed = await this.destroyAllSessions((user._id as any).toString());

    // Send confirmation email
    this.mailService.sendPasswordChangeConfirmation(
      user.email,
      passwordChangeRecord.changedAt,
      undefined, // IP address (can be added from request context)
      undefined, // User agent (can be added from request context)
      sessionsDestroyed.deletedCount
    );

    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Password Reset',
      entity: 'User',
      entityId: (user._id as any).toString(),
      entityName: `${user.firstName} ${user.lastName}`,
      userId: (user._id as any).toString(),
      userEmail: user.email,
      type: 'update'
    });

    return { 
      message: 'Password reset successfully. You have been logged out from all devices for security.',
      sessionsDestroyed: sessionsDestroyed.deletedCount
    };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto, userEmail?: string): Promise<UserProfileResponse> {
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update preferences
    if (dto.theme !== undefined) user.preferences.theme = dto.theme;
    if (dto.language !== undefined) user.preferences.language = dto.language;
    if (dto.emailNotifications !== undefined) user.preferences.notifications.email = dto.emailNotifications;
    if (dto.pushNotifications !== undefined) user.preferences.notifications.push = dto.pushNotifications;

    await user.save();

    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Preferences Updated',
      entity: 'User',
      entityId: (user._id as any).toString(),
      entityName: `${user.firstName} ${user.lastName}`,
      userId: (user._id as any).toString(),
      userEmail: userEmail || user.email,
      type: 'update'
    });

    return this.getProfile(userId);
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, limit: number = 10): Promise<UserActivityResponse[]> {
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get activities for this user
    const activities = await this.activityLogService.getActivitiesByEntity('User', limit);
    
    return activities
      .filter(activity => activity.userId === userId)
      .map(activity => ({
        id: activity._id.toString(),
        action: activity.action,
        entity: activity.entity,
        entityName: activity.entityName,
        timestamp: activity.timestamp,
        type: activity.type,
        details: activity.details
      }));
  }

  /**
   * Get first admin user (for testing purposes)
   */
  async getFirstAdminUser() {
    return AdminUserModel.findOne({ role: { $in: ['admin', 'super_admin'] } });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    return AdminUserModel.findById(userId);
  }

  /**
   * Get last password change for user
   */
  async getLastPasswordChange(userId: string) {
    return PasswordHistoryModel.findOne({ userId })
      .sort({ changedAt: -1 })
      .lean();
  }

  /**
   * Record password change in history
   */
  async recordPasswordChange(userId: string, changedBy: string, reason: 'change' | 'reset' | 'admin' = 'change', ipAddress?: string, userAgent?: string) {
    return PasswordHistoryModel.create({
      userId,
      changedAt: new Date(),
      changedBy,
      ipAddress,
      userAgent,
      reason
    });
  }

  /**
   * Destroy all active sessions for a user (logout from all devices)
   */
  async destroyAllSessions(userId: string) {
    const result = await RefreshTokenModel.deleteMany({ userId });
    return result;
  }

  /**
   * Enable 2FA for a user
   */
  async enableTwoFactor(userId: string, dto: EnableTwoFactorDto, userEmail?: string): Promise<{ message: string }> {
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify OTP
    const passwordReset = await PasswordResetModel.findOne({
      email: userEmail || user.email,
      otp: dto.otp,
      otpExpiresAt: { $gt: new Date() },
      isUsed: false
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark OTP as used
    passwordReset.isUsed = true;
    await passwordReset.save();

    // Generate 2FA secret
    const twoFactorSecret = crypto.randomBytes(32).toString('hex');

    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorSecret = twoFactorSecret;
    await user.save();

    // Send 2FA enabled confirmation email
     this.mailService.send2FAStatusChangeEmail(
      userEmail || user.email, 
      true, 
      new Date()
    );

    // Log the activity
    await this.activityLogService.logActivity({
      action: '2FA Enabled',
      entity: 'User',
      entityId: (user._id as any).toString(),
      entityName: `${user.firstName} ${user.lastName}`,
      userId: (user._id as any).toString(),
      userEmail: userEmail || user.email,
      type: 'update'
    });

    return { message: AdminMessages.TWO_FACTOR_ENABLED_SUCCESS };
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string, dto: DisableTwoFactorDto, userEmail?: string): Promise<{ message: string }> {
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify OTP
    const passwordReset = await PasswordResetModel.findOne({
      email: userEmail || user.email,
      otp: dto.otp,
      otpExpiresAt: { $gt: new Date() },
      isUsed: false
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark OTP as used
    passwordReset.isUsed = true;
    await passwordReset.save();

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    // Send 2FA disabled confirmation email
     this.mailService.send2FAStatusChangeEmail(
      userEmail || user.email, 
      false, 
      new Date()
    );

    // Log the activity
    await this.activityLogService.logActivity({
      action: '2FA Disabled',
      entity: 'User',
      entityId: (user._id as any).toString(),
      entityName: `${user.firstName} ${user.lastName}`,
      userId: (user._id as any).toString(),
      userEmail: userEmail || user.email,
      type: 'update'
    });

    return { message: AdminMessages.TWO_FACTOR_DISABLED_SUCCESS };
  }

  /**
   * Request 2FA setup (send OTP for enabling/disabling)
   */
  async requestTwoFactorSetup(userId: string, userEmail?: string): Promise<{ message: string }> {
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate OTP
    const otp = this.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    await PasswordResetModel.create({
      email: userEmail || user.email,
      token: crypto.randomBytes(32).toString('hex'),
      otp,
      otpExpiresAt,
      tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isUsed: false
    });

    // Send 2FA setup OTP email
     this.mailService.send2FASetupEmail(userEmail || user.email, otp, '2FA Setup');

    return { message: AdminMessages.TWO_FACTOR_SETUP_OTP_SENT };
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get time ago string (e.g., "3 months ago", "2 days ago")
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInYears > 0) {
      return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    } else if (diffInMonths > 0) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours > 0) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      }
    }
  }
} 