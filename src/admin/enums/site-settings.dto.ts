import { IsString, IsEmail, IsOptional, IsBoolean, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SocialMediaDto {
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @IsOptional()
  @IsUrl()
  twitter?: string;

  @IsOptional()
  @IsUrl()
  instagram?: string;

  @IsOptional()
  @IsUrl()
  linkedin?: string;
}

export class CreateSiteSettingsDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsString()
  siteName: string;

  @IsUrl()
  siteUrl: string;

  @IsString()
  siteDescription: string;

  @IsEmail()
  businessEmail: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  timezone: string;

  @IsString()
  contactNumber: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsOptional()
  @IsString()
  businessHours?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsUrl()
  siteUrl?: string;

  @IsOptional()
  @IsString()
  siteDescription?: string;

  @IsOptional()
  @IsEmail()
  businessEmail?: string;

  @IsOptional()
  @IsEmail()
  adminEmail?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsOptional()
  @IsString()
  businessHours?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SiteSettingsResponseDto {
  id: string;
  key: string;
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  businessEmail: string;
  adminEmail: string;
  timezone: string;
  contactNumber: string;
  businessAddress: string;
  businessHours: string;
  socialMedia: SocialMediaDto;
  logoUrl: string;
  faviconUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SiteSettingsListResponseDto {
  success: boolean;
  message: string;
  data: SiteSettingsResponseDto[];
  totalCount: number;
} 