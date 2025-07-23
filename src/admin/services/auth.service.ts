import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminUserModel } from '../models/user.schema';
import { AdminLoginDto, AdminLoginResponseDto } from '../enums/login.dto';
import { AdminErrorResponse } from '../enums/response';
import { RefreshTokenModel } from '../models/refresh-token.schema';
import { MailService } from '../../mail/mail.service';
import { AdminMessages } from '../enums/messages';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  /**
   * Handles admin login:
   * 1. Finds the admin user by email only.
   * 2. Checks the password using bcrypt.
   * 3. Generates access and refresh JWT tokens.
   * 4. Saves the refresh token in the database for future validation.
   * 5. Sends a login notification email to the admin.
   * 6. Returns tokens and user info on success.
   * Throws UnauthorizedException on failure.
   */
  async login(dto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    // 1. Find the admin user by email only
    const user = await AdminUserModel.findOne({
      email: dto.email,
      role: 'admin',
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
    // 3. Generate access token (short-lived, e.g. 15 minutes)
    const accessToken: string = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );
    // 4. Generate refresh token (long-lived, e.g. 7 days)
    const refreshToken: string = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET || 'refreshsecret',
      { expiresIn: '7d' }
    );
    // 5. Save refresh token in DB for future validation and revocation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await RefreshTokenModel.create({
      userId: user._id, // Reference to the admin user
      token: refreshToken, // The refresh token string
      expiresAt, // Expiry date for the refresh token
      deviceData: dto.deviceData, // Device info from login request
      ipAddress: dto.ipAddress, // IP address from login request
      location: dto.location, // Location coordinates from login request
    });
    // 6. Send login notification email to the admin
     this.mailService.sendLoginNotification(
      user.email,
      dto.deviceData || {},
      dto.location,
      dto.ipAddress
    );
    // 7. Return tokens and user info
    return {
      accessToken,
      refreshToken,
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
      },
    };
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
      { id: user._id, role: user.role },
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
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
      },
    };
  }
} 