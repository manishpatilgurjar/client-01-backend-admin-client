import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { CampaignStatus, CampaignType } from '../models/campaign.schema';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(CampaignType)
  type?: CampaignType;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  sendInterval?: number; // seconds between emails

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number;

  @IsOptional()
  @IsBoolean()
  includeUnsubscribed?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(CampaignType)
  type?: CampaignType;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  sendInterval?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number;

  @IsOptional()
  @IsBoolean()
  includeUnsubscribed?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: {
    lastError?: string;
    retryCount?: number;
    nextRetryAt?: Date;
  };
}

export class CampaignResponseDto {
  _id: string;
  name: string;
  subject: string;
  content: string;
  type: CampaignType;
  status: CampaignStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  recipientEmails: string[];
  sentEmails: string[];
  failedEmails: string[];
  settings: {
    sendInterval: number;
    maxRetries: number;
    includeUnsubscribed: boolean;
  };
  createdBy: string;
  createdByEmail: string;
  notes?: string;
  metadata?: {
    lastError?: string;
    retryCount?: number;
    nextRetryAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class CampaignStatsDto {
  totalCampaigns: number;
  draftCampaigns: number;
  scheduledCampaigns: number;
  runningCampaigns: number;
  completedCampaigns: number;
  failedCampaigns: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  averageOpenRate: number;
  averageClickRate: number;
}

export class RunCampaignDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customEmails?: string[]; // Override default enquiry emails
} 