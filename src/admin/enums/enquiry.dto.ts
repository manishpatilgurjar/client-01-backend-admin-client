import { IsString, IsEmail, IsOptional, IsNotEmpty, IsEnum, IsBoolean, IsMongoId } from 'class-validator';

// Contact Form Submission DTO
export class ContactFormDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsEnum(['General Inquiry', 'Product Inquiry', 'Technical Support', 'Sales Inquiry', 'Partnership', 'Other'])
  @IsNotEmpty()
  inquiryCategory: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

// Admin Reply DTO
export class AdminReplyDto {
  @IsString()
  @IsNotEmpty()
  replyMessage: string;
}

// Admin Update Enquiry DTO
export class UpdateEnquiryDto {
  @IsEnum(['new', 'in-progress', 'replied', 'closed'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isStarred?: boolean;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

// Admin Query Parameters DTO
export class EnquiryQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(['new', 'in-progress', 'replied', 'closed'])
  @IsOptional()
  status?: string;

  @IsEnum(['General Inquiry', 'Product Inquiry', 'Technical Support', 'Sales Inquiry', 'Partnership', 'Other'])
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  starred?: boolean;

  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;

  // Enhanced filtering options
  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  hasReplies?: boolean;

  @IsBoolean()
  @IsOptional()
  hasAdminNotes?: boolean;
}

// Export Enquiries DTO
export class ExportEnquiriesDto {
  @IsEnum(['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisYear', 'custom'])
  @IsOptional()
  dateFilter?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsEnum(['new', 'in-progress', 'replied', 'closed'])
  @IsOptional()
  status?: string;

  @IsEnum(['General Inquiry', 'Product Inquiry', 'Technical Support', 'Sales Inquiry', 'Partnership', 'Other'])
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  starred?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}

// Export Response DTO
export class ExportEnquiriesResponseDto {
  success: boolean;
  message: string;
  data: {
    enquiries: {
      fullName: string;
      email: string;
      phone: string;
      message: string;
      contactDate: string;
    }[];
    totalCount: number;
    exportDate: string;
    filters: {
      dateFilter?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      category?: string;
      starred?: boolean;
      search?: string;
    };
  };
}

// Response DTOs
export class EnquiryResponseDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  inquiryCategory: string;
  message: string;
  status: string;
  isStarred: boolean;
  ipAddress?: string;
  userAgent?: string;
  adminNotes?: string;
  repliedAt?: Date;
  replies?: {
    adminName: string;
    adminEmail: string;
    replyMessage: string;
    repliedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export class EnquiryListResponseDto {
  enquiries: EnquiryResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class ContactFormResponseDto {
  success: boolean;
  message: string;
  enquiryId?: string;
}

export class AdminReplyResponseDto {
  success: boolean;
  message: string;
  replyId?: string;
} 