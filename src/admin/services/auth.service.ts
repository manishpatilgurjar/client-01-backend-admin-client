import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AdminUserModel } from '../models/user.schema';
import { AdminLoginDto, AdminLoginResponseDto, AdminLoginWithOTPDto, AdminLoginStep1ResponseDto } from '../enums/login.dto';
import { AdminErrorResponse } from '../enums/response';
import { RefreshTokenModel } from '../models/refresh-token.schema';
import { PasswordResetModel } from '../models/password-reset.schema';
import { MailService } from '../../mail/mail.service';
import { AdminMessages } from '../enums/messages';
import * as crypto from 'crypto';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  /**
   * Handles admin login with 2FA support:
   * 1. Finds the admin user by email only.
   * 2. Checks the password using bcrypt.
   * 3. If 2FA is enabled, sends OTP and returns temp token with stored login data.
   * 4. If 2FA is disabled, proceeds with normal login.
   * Throws UnauthorizedException on failure.
   */
  async login(dto: AdminLoginDto): Promise<AdminLoginResponseDto | AdminLoginStep1ResponseDto> {



    // 1. Find the admin user by email only (accept both admin and super_admin roles)
    const user = await AdminUserModel.findOne({
      email: dto.email,
      role: { $in: ['admin', 'super_admin'] },
    });
    
    if (!user) {
      // If user not found, throw error
      throw new UnauthorizedException(AdminMessages.LOGIN_INVALID_CREDENTIALS);
    }
    // 2. Check the password using bcrypt
    const isMatch = await bcrypt.compare(dto.password, user.password);
    
    if (!isMatch) {
      // If password does not match, throw error
      throw new UnauthorizedException(AdminMessages.LOGIN_INVALID_CREDENTIALS);
    }

    // 3. Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate OTP for 2FA
      const otp = this.generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store login data temporarily with OTP for later use
      const loginData = {
        deviceData: dto.deviceData || {},
        ipAddress: dto.ipAddress || '',
        location: dto.location
      };

      // Save OTP with login data
      await PasswordResetModel.create({
        email: user.email,
        token: crypto.randomBytes(32).toString('hex'),
        otp,
        otpExpiresAt,
        tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isUsed: false,
        loginData: loginData // Store login data for later use
      });

      // Send OTP email for 2FA login
      this.mailService.sendOTPEmail(user.email, otp, 'Login Verification');

      // Generate temporary token for 2FA verification
      const tempToken = jwt.sign(
        { id: user._id, role: user.role, requires2FA: true },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '10m' }
      );

      return {
        requiresOTP: true,
        message: 'OTP sent to your email for two-factor authentication',
        tempToken
      };
    }

    // 4. Proceed with normal login (2FA disabled)
    return this.completeLogin(user, dto);
  }

  /**
   * Generates a new access token using a valid refresh token.
   * @param refreshToken - The refresh token string
   * @returns An object with a new access token and user info
   * Throws UnauthorizedException if the token is invalid or expired
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; user: any }> {
    // 1. Find the refresh token in the database
    const tokenDoc = await RefreshTokenModel.findOne({ token: refreshToken });
    if (!tokenDoc) {
      throw new UnauthorizedException(AdminMessages.LOGIN_INVALID_TOKEN);
    }
    // 2. Check if the refresh token is expired
    if (tokenDoc.expiresAt < new Date()) {
      throw new UnauthorizedException(AdminMessages.LOGIN_INVALID_TOKEN);
    }
    // 3. Find the user associated with the refresh token
    const user = await AdminUserModel.findById(tokenDoc.userId);
    if (!user) {
      throw new UnauthorizedException(AdminMessages.LOGIN_USER_NOT_FOUND);
    }
    // 4. Generate a new access token
    const accessToken: string = jwt.sign(
      { id: user._id, role: user.role, g_id: tokenDoc._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );
    // 5. Return the new access token and user info
    return {
      accessToken,
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        location: user.location,
      },
    };
  }

  /**
   * Handles admin logout by invalidating the refresh token.
   * @param accessToken - The access token containing g_id
   * @returns Success message (always returns success for security)
   */
  async logout(accessToken: string): Promise<{ message: string }> {
    try {
      // 1. Decode the access token to get g_id
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'secret') as any;
      
      if (!decoded.g_id) {
        // Token is invalid but return success for security
        return { message: AdminMessages.LOGOUT_SUCCESS };
      }

      // 2. Delete the refresh token record from the database
      const deletedToken = await RefreshTokenModel.findByIdAndDelete(decoded.g_id);
      
      // 3. Return success message regardless of whether token was found
      return { message: AdminMessages.LOGOUT_SUCCESS };
    } catch (error) {
      // If JWT verification fails or any other error, still return success
      // This prevents token enumeration attacks
      return { message: AdminMessages.LOGOUT_SUCCESS };
    }
  }

  /**
   * Verify 2FA OTP and complete login
   */
  async verify2FAAndLogin(dto: AdminLoginWithOTPDto, tempToken: string): Promise<AdminLoginResponseDto> {
    try {
      // Decode temp token
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret') as any;
      
      if (!decoded.requires2FA) {
        throw new UnauthorizedException(AdminMessages.INVALID_TEMPORARY_TOKEN);
      }

      // Find user
      const user = await AdminUserModel.findById(decoded.id);
      if (!user) {
        throw new UnauthorizedException(AdminMessages.LOGIN_USER_NOT_FOUND);
      }

      // Verify OTP
      const passwordReset = await PasswordResetModel.findOne({
        email: user.email,
        otp: dto.otp,
        otpExpiresAt: { $gt: new Date() },
        isUsed: false
      });

      if (!passwordReset) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Extract stored login data
      const loginData = passwordReset.loginData || {
        deviceData: {},
        ipAddress: '',
        location: undefined
      };

      // Mark OTP as used
      passwordReset.isUsed = true;
      await passwordReset.save();

      // Proceed with normal login flow using stored login data
      return this.completeLogin(user, loginData);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException(AdminMessages.INVALID_TEMPORARY_TOKEN);
    }
  }

  /**
   * Complete login process (extracted from original login method)
   */
  private async completeLogin(user: any, dto: any): Promise<AdminLoginResponseDto> {
    // Generate refresh token (long-lived, e.g. 7 days)
    const refreshToken: string = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET || 'refreshsecret',
      { expiresIn: '7d' }
    );

    // Save refresh token in DB for future validation and revocation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    const refreshTokenDoc = await RefreshTokenModel.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
      deviceData: dto.deviceData,
      ipAddress: dto.ipAddress,
      location: dto.location,
    });

    // Generate access token (short-lived, e.g. 15 minutes) with g_id
    const accessToken: string = jwt.sign(
      { id: user._id, role: user.role, g_id: refreshTokenDoc._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    // Send login notification email to the admin
    try {
      await this.mailService.sendLoginNotification(
        user.email,
        dto.deviceData || {},
        dto.location,
        dto.ipAddress
      );
    } catch (error) {
      console.error('Failed to send login notification email:', error);
      // Don't throw the error to prevent application crashes
    }

    // Return tokens and user info
    return {
      accessToken,
      refreshToken,
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        location: user.location,
      },
    };
  }

  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
} 