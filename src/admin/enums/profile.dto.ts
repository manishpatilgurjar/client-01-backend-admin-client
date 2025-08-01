import { IsString, IsEmail, IsOptional, IsNotEmpty, MinLength, MaxLength, Matches, IsBoolean, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  @Matches(/^[\+]?[1-9][\d]{0,15}$/, { message: 'Please provide a valid phone number' })
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Location must not exceed 100 characters' })
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  bio?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Current password must be at least 6 characters' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @MaxLength(50, { message: 'New password must not exceed 50 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class RequestPasswordResetDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export class VerifyOTPDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'OTP must be 6 characters' })
  @MaxLength(6, { message: 'OTP must be 6 characters' })
  otp: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @MaxLength(50, { message: 'New password must not exceed 50 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  newPassword: string;
}

export class UpdatePreferencesDto {
  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark'], { message: 'Theme must be either light or dark' })
  theme?: 'light' | 'dark';

  @IsString()
  @IsOptional()
  @IsIn(['en', 'es', 'fr'], { message: 'Language must be en, es, or fr' })
  language?: 'en' | 'es' | 'fr';

  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;
}

export class UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  role: string;
  joinDate: Date;
  joinDateFormatted: string;
  lastLogin: Date;
  lastLoginTime: string;
  lastPasswordChange?: {
    changedAt: Date;
    changedAtFormatted: string;
    changedBy: string;
    reason: string;
    timeAgo: string;
  };
  isActive: boolean;
  permissions: string[];
  preferences: {
    theme: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  updatedAt?: Date;
}

export class UserActivityResponse {
  id: string;
  action: string;
  entity: string;
  entityName?: string;
  timestamp: Date;
  type: string;
  details?: string;
} 