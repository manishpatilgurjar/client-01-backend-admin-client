import { IsString, IsArray, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsEnum(['Draft', 'Published', 'Archived'])
  status?: 'Draft' | 'Published' | 'Archived';

  @IsString()
  shortDescription: string;

  @IsString()
  fullDescription: string;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['Draft', 'Published', 'Archived'])
  status?: 'Draft' | 'Published' | 'Archived';

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  fullDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateProductStatusDto {
  @IsEnum(['Draft', 'Published', 'Archived'])
  status: 'Draft' | 'Published' | 'Archived';

  @IsBoolean()
  isPublished: boolean;
} 