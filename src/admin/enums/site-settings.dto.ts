import { IsString, IsEmail, IsOptional, IsBoolean, IsUrl, ValidateNested, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, Validate } from 'class-validator';
import { Type } from 'class-transformer';

export class BusinessAddressDto {
  @IsOptional()
  @IsString()
  line1?: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  pinCode?: string;
}

@ValidatorConstraint({ name: 'IsUrlOrEmpty', async: false })
export class IsUrlOrEmptyConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value || value === '') {
      return true; // Allow empty string
    }
    // Use the standard URL validation for non-empty values
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid URL or empty`;
  }
}

export class SocialMediaDto {
  @IsOptional()
  @Validate(IsUrlOrEmptyConstraint)
  facebook?: string;

  @IsOptional()
  @Validate(IsUrlOrEmptyConstraint)
  twitter?: string;

  @IsOptional()
  @Validate(IsUrlOrEmptyConstraint)
  instagram?: string;

  @IsOptional()
  @Validate(IsUrlOrEmptyConstraint)
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
  @ValidateNested()
  @Type(() => BusinessAddressDto)
  businessAddress?: BusinessAddressDto;

  @IsOptional()
  @IsString()
  businessHours?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;

  @IsOptional()
  @Validate(IsUrlOrEmptyConstraint)
  logoUrl?: string;

  @IsOptional()
  @Validate(IsUrlOrEmptyConstraint)
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
  @ValidateNested()
  @Type(() => BusinessAddressDto)
  businessAddress?: BusinessAddressDto;

  @IsOptional()
  @IsString()
  businessHours?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;

  @IsOptional()
  @Validate(IsUrlOrEmptyConstraint)
  logoUrl?: string;

  @IsOptional()
  @Validate(IsUrlOrEmptyConstraint)
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
  businessAddress: BusinessAddressDto;
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