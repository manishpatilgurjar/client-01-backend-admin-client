import { Controller, Post, Body, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { ContactFormDto } from '../enums/enquiry.dto';
import { EnquiryService } from '../services/enquiry.service';
import { Request } from 'express';

@Controller('contact')
export class ContactController {
  constructor(private readonly enquiryService: EnquiryService) {}

  /**
   * Submit contact form (Public API)
   * POST /contact/submit
   */
  @Post('submit')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async submitContactForm(@Body() dto: ContactFormDto, @Req() req: Request) {
    // Extract IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
    const userAgent = req.headers['user-agent'];

    const result = await this.enquiryService.submitContactForm(dto, ipAddress, userAgent);
    
    return {
      success: true,
      message: result.message,
      data: {
        enquiryId: result.enquiryId
      }
    };
  }
} 