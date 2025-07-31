import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  Query, 
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { FAQService } from '../services/faq.service';
import { CreateFAQDto, UpdateFAQDto, UpdateFAQStatusDto } from '../enums/faq.dto';
import { AdminSuccessResponse } from '../enums/response';

@Controller('admin/faqs')
export class FAQController {
  constructor(private readonly faqService: FAQService) {}

  /**
   * GET /admin/faqs - Get All FAQs
   */
  @Get()
  async getAllFAQs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string
  ) {
    const result = await this.faqService.getAllFAQs(
      parseInt(page),
      parseInt(limit),
      search
    );
    return new AdminSuccessResponse('FAQs fetched successfully', result);
  }

  /**
   * GET /admin/faqs/:id - Get Single FAQ
   */
  @Get(':id')
  async getFAQById(@Param('id') id: string) {
    const faq = await this.faqService.getFAQById(id);
    return new AdminSuccessResponse('FAQ fetched successfully', faq);
  }

  /**
   * POST /admin/faqs - Create New FAQ
   */
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createFAQ(@Body() dto: CreateFAQDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const faq = await this.faqService.createFAQ(dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('FAQ created successfully', faq);
  }

  /**
   * PUT /admin/faqs/:id - Update FAQ
   */
  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateFAQ(@Param('id') id: string, @Body() dto: UpdateFAQDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const faq = await this.faqService.updateFAQ(id, dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('FAQ updated successfully', faq);
  }

  /**
   * DELETE /admin/faqs/:id - Delete FAQ
   */
  @Delete(':id')
  async deleteFAQ(@Param('id') id: string) {
    // TODO: Get user info from JWT token when auth is implemented
    const result = await this.faqService.deleteFAQ(id, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('FAQ deleted successfully', result);
  }

  /**
   * PATCH /admin/faqs/:id/status - Update FAQ Status
   */
  @Patch(':id/status')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateFAQStatus(@Param('id') id: string, @Body() dto: UpdateFAQStatusDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const result = await this.faqService.updateFAQStatus(id, dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('FAQ status updated successfully', result);
  }
} 