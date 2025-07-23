import { IsString, IsOptional, IsArray, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class TeamMemberDto {
  @IsString() name: string;
  @IsString() role: string;
  @IsOptional() @IsString() photo?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() linkedin?: string;
}

export class SocialLinksDto {
  @IsOptional() @IsString() facebook?: string;
  @IsOptional() @IsString() twitter?: string;
  @IsOptional() @IsString() linkedin?: string;
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() youtube?: string;
}

export class CreateAboutUsDto {
  @IsString() title: string;
  @IsString() description: string;
  @IsArray() @IsString({ each: true }) images: string[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => TeamMemberDto) team: TeamMemberDto[];
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @ValidateNested() @Type(() => SocialLinksDto) socialLinks?: SocialLinksDto;
}

export class UpdateAboutUsDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TeamMemberDto) team?: TeamMemberDto[];
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @ValidateNested() @Type(() => SocialLinksDto) socialLinks?: SocialLinksDto;
} 