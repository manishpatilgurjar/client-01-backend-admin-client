import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class CreateFAQDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsOptional()
  @IsEnum(['Draft', 'Published', 'Archived'])
  status?: 'Draft' | 'Published' | 'Archived';

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateFAQDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsEnum(['Draft', 'Published', 'Archived'])
  status?: 'Draft' | 'Published' | 'Archived';

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateFAQStatusDto {
  @IsEnum(['Draft', 'Published', 'Archived'])
  status: 'Draft' | 'Published' | 'Archived';

  @IsBoolean()
  isPublished: boolean;
} 