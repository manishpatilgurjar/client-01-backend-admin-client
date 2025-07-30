import { IsString, IsOptional, IsArray, ValidateNested, IsEmail, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class TeamMemberDto {
  @IsOptional() @IsString() _id?: string;
  @IsString() name: string;
  @IsString() position: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() linkedin?: string;
  @IsOptional() @IsString() twitter?: string;
  @IsOptional() @IsNumber() order?: number;
}

export class AboutSectionDto {
  @IsOptional() @IsString() _id?: string;
  @IsString() title: string;
  @IsString() content: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() order?: number;
}

export class SocialLinksDto {
  @IsOptional() @IsString() facebook?: string;
  @IsOptional() @IsString() twitter?: string;
  @IsOptional() @IsString() linkedin?: string;
  @IsOptional() @IsString() instagram?: string;
  @IsOptional() @IsString() youtube?: string;
}

export class UpdateAboutUsDto {
  @IsOptional() @IsString() mainTitle?: string;
  @IsOptional() @IsString() mainDescription?: string;
  @IsOptional() @IsString() mainImage?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AboutSectionDto) sections?: AboutSectionDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TeamMemberDto) teamMembers?: TeamMemberDto[];
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @ValidateNested() @Type(() => SocialLinksDto) socialLinks?: SocialLinksDto;
} 