import { IsString, IsEmail, IsOptional, IsBoolean, IsArray, IsEnum, MinLength, MaxLength } from 'class-validator';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin'
}

export enum AdminStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

/**
 * DTO for creating a new admin
 */
export class CreateAdminDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(50, { message: 'Username must not exceed 50 characters' })
  username: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  lastName: string;

  @IsEnum(AdminRole, { message: 'Role must be either super_admin or admin' })
  role: AdminRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO for updating an admin
 */
export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(50, { message: 'Username must not exceed 50 characters' })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  lastName?: string;

  @IsOptional()
  @IsEnum(AdminRole, { message: 'Role must be either super_admin or admin' })
  role?: AdminRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO for changing admin password
 */
export class ChangeAdminPasswordDto {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;

  @IsString()
  @MinLength(8, { message: 'Confirm password must be at least 8 characters' })
  confirmPassword: string;
}

/**
 * DTO for admin query parameters
 */
export class AdminQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @IsOptional()
  @IsEnum(AdminStatus)
  status?: AdminStatus;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO for admin response
 */
export class AdminResponseDto {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole | string;
  phone?: string;
  location?: string;
  bio?: string;
  profilePic?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  permissions: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for admin list response
 */
export class AdminListResponseDto {
  success: boolean;
  message: string;
  data: AdminResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * DTO for admin stats response
 */
export class AdminStatsResponseDto {
  success: boolean;
  message: string;
  data: {
    total: number;
    superAdmins: number;
    admins: number;
    active: number;
    inactive: number;
    online: number;
  };
} 