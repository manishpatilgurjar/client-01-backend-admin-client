import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsNumber, IsEnum, MaxLength, IsIn, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class PageSectionContentDto {
  @IsString() title: string;
  @IsString() subtitle: string;
  @IsString() description: string;
  @IsString() buttonText: string;
  @IsString() buttonLink: string;
  @IsOptional() @IsArray() @IsMongoId({ each: true }) featuredProducts?: string[];
}

export class PageSectionDto {
  @IsOptional() @IsString() _id?: string;
  @IsString() @IsIn(['Hero Section', 'About Section', 'Featured Products', 'Contact Information']) name: string;
  @IsString() description: string;
  @IsOptional() @IsEnum(['Active', 'Draft', 'Inactive']) status?: 'Active' | 'Draft' | 'Inactive';
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() order?: number;
  @IsOptional() @ValidateNested() @Type(() => PageSectionContentDto) content?: PageSectionContentDto;
}

export class UpdateIndexPageDto {
  @IsOptional() @IsString() pageTitle?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PageSectionDto) sections?: PageSectionDto[];
}

export class CreateSectionDto {
  @IsString() @IsIn(['Hero Section', 'About Section', 'Featured Products', 'Contact Information']) name: string;
  @IsString() description: string;
  @IsOptional() @IsEnum(['Active', 'Draft', 'Inactive']) status?: 'Active' | 'Draft' | 'Inactive';
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() order?: number;
  @ValidateNested() @Type(() => PageSectionContentDto) content: PageSectionContentDto;
}

export class UpdateSectionDto {
  @IsOptional() @IsString() @IsIn(['Hero Section', 'About Section', 'Featured Products', 'Contact Information']) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(['Active', 'Draft', 'Inactive']) status?: 'Active' | 'Draft' | 'Inactive';
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() order?: number;
  @IsOptional() @ValidateNested() @Type(() => PageSectionContentDto) content?: PageSectionContentDto;
}

export class UpdateFeaturedProductsDto {
  @IsArray() @IsMongoId({ each: true }) @MaxLength(4, { each: false }) featuredProducts: string[];
}

export class UpdateSectionStatusDto {
  @IsBoolean() isActive: boolean;
  @IsOptional() @IsEnum(['Active', 'Draft', 'Inactive']) status?: 'Active' | 'Draft' | 'Inactive';
} 