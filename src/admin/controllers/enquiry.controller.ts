import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UsePipes, 
  ValidationPipe,
  Req
} from '@nestjs/common';
import { 
  ContactFormDto, 
  UpdateEnquiryDto, 
  EnquiryQueryDto,
  AdminReplyDto,
  ExportEnquiriesDto
} from '../enums/enquiry.dto';
import { EnquiryService } from '../services/enquiry.service';
import { AdminSuccessResponse } from '../enums/response';
import { AdminMessages } from '../enums/messages';
import { Request } from 'express';

@Controller('admin/enquiries')
export class EnquiryController {
  constructor(private readonly enquiryService: EnquiryService) {}

  /**
   * Get all enquiries with filtering and pagination
   * GET /admin/enquiries
   */
  @Get()
  async getAllEnquiries(@Query() query: EnquiryQueryDto) {
    const result = await this.enquiryService.getAllEnquiries(query);
    return new AdminSuccessResponse(AdminMessages.ENQUIRIES_FETCHED_SUCCESS, result);
  }

  /**
   * Get enquiry statistics
   * GET /admin/enquiries/stats/overview
   */
  @Get('stats/overview')
  async getEnquiryStats() {
    const stats = await this.enquiryService.getEnquiryStats();
    return new AdminSuccessResponse('Enquiry statistics retrieved successfully', stats);
  }

  /**
   * Get filter options for frontend
   * GET /admin/enquiries/filter-options
   */
  @Get('filter-options')
  async getFilterOptions() {
    const options = await this.enquiryService.getFilterOptions();
    return new AdminSuccessResponse('Filter options retrieved successfully', options);
  }

  /**
   * Export enquiries for CSV generation
   * POST /admin/enquiries/export
   */
  @Post('export')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async exportEnquiries(@Body() dto: ExportEnquiriesDto) {
    const result = await this.enquiryService.exportEnquiries(dto);
    return new AdminSuccessResponse('Enquiries exported successfully', result);
  }

  /**
   * Get single enquiry by ID
   * GET /admin/enquiries/:id
   */
  @Get(':id')
  async getEnquiryById(@Param('id') id: string) {
    const enquiry = await this.enquiryService.getEnquiryById(id);
    return new AdminSuccessResponse(AdminMessages.ENQUIRY_FETCHED_SUCCESS, enquiry);
  }

  /**
   * Update enquiry (status, starred, admin notes)
   * PUT /admin/enquiries/:id
   */
  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateEnquiry(@Param('id') id: string, @Body() dto: UpdateEnquiryDto) {
    const result = await this.enquiryService.updateEnquiry(id, dto);
    return new AdminSuccessResponse(result.message);
  }

  /**
   * Send admin reply to enquiry submitter
   * POST /admin/enquiries/:id/reply
   */
  @Post(':id/reply')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async sendAdminReply(
    @Param('id') id: string, 
    @Body() dto: AdminReplyDto,
    @Req() req: Request
  ) {
    // Get admin name and email from request (assuming it's attached by auth middleware)
    const adminName = (req as any).user?.firstName && (req as any).user?.lastName
      ? `${(req as any).user.firstName} ${(req as any).user.lastName}`
      : (req as any).user?.username || 'Admin';
    
    const adminEmail = (req as any).user?.email || 'admin@medoscopic.com';

    const result = await this.enquiryService.sendAdminReply(id, dto.replyMessage, adminName, adminEmail);
    return new AdminSuccessResponse(result.message);
  }

  /**
   * Delete enquiry
   * DELETE /admin/enquiries/:id
   */
  @Delete(':id')
  async deleteEnquiry(@Param('id') id: string) {
    const result = await this.enquiryService.deleteEnquiry(id);
    return new AdminSuccessResponse(result.message);
  }
} 