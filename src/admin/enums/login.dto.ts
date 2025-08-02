import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * DTO for admin login requests.
 * Accepts only email and a password, plus device/session info.
 */
export class AdminLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(1, { message: 'Password cannot be empty' })
  password: string;

  @IsOptional()
  deviceData?: Record<string, any>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  location?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * DTO for refresh token requests.
 * Contains the refresh token string.
 */
export class RefreshTokenRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}

/**
 * DTO for admin login responses.
 * Contains access and refresh tokens, and user info.
 */
export class AdminLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    profilePic?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
  };
}

export class AdminLoginWithOTPDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'OTP must be 6 characters' })
  @MaxLength(6, { message: 'OTP must be 6 characters' })
  otp: string;
}

export class AdminLoginStep1ResponseDto {
  requiresOTP: boolean;
  message: string;
  tempToken?: string;
}

/**
 * DTO for logout requests.
 * Contains the access token for logout.
 */
export class LogoutRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Access token is required' })
  accessToken: string;
} 