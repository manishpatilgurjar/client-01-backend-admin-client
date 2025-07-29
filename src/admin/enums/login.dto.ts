/**
 * DTO for admin login requests.
 * Accepts only email and a password, plus device/session info.
 */
export class AdminLoginDto {
  email: string;
  password: string;
  deviceData?: Record<string, any>;
  ipAddress?: string;
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
    fullName?: string;
    phone?: string;
    address?: string;
  };
}

/**
 * DTO for logout requests.
 * Contains the access token for logout.
 */
export class LogoutRequestDto {
  accessToken: string;
} 