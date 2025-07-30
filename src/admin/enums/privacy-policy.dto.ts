import { IsString, IsOptional } from 'class-validator';

export class UpdatePrivacyPolicyDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() policyDescription?: string;
} 