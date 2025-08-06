import { 
  Controller, 
  Get, 
  Post,
  Body,
  Req,
  Ip
} from '@nestjs/common';
import { Request } from 'express';
import { ClientContactUsService } from '../services/contact-us.service';
import { AdminSuccessResponse } from '../../admin/enums/response';

@Controller('api/client/contact-us')
export class ClientContactUsController {
  constructor(private readonly contactUsService: ClientContactUsService) {}

  /**
   * GET /api/client/contact-us
   * Get complete contact us data (contact details + FAQs + inquiry categories)
   */
  @Get()
  async getContactUsData() {
    const data = await this.contactUsService.getContactUsData();
    return new AdminSuccessResponse('Contact us data fetched successfully', data);
  }

  /**
   * POST /api/client/contact-us/submit
   * Submit contact form
   */
  @Post('submit')
  async submitContactForm(
    @Body() contactData: {
      fullName: string;
      email: string;
      phone?: string;
      subject: string;
      inquiryCategory: string;
      message: string;
    },
    @Req() req: Request,
    @Ip() ip: string
  ) {
    const enquiry = await this.contactUsService.submitContactForm({
      ...contactData,
      ipAddress: ip,
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    return new AdminSuccessResponse('Contact form submitted successfully', {
      id: enquiry._id,
      message: 'Thank you for your inquiry. We will get back to you soon!'
    });
  }

  /**
   * GET /api/client/contact-us/contact-details
   * Get only contact details
   */
  @Get('contact-details')
  async getContactDetails() {
    const contactDetails = await this.contactUsService.getContactDetails();
    return new AdminSuccessResponse('Contact details fetched successfully', contactDetails);
  }

  /**
   * GET /api/client/contact-us/faqs
   * Get only FAQs
   */
  @Get('faqs')
  async getFAQs() {
    const faqs = await this.contactUsService.getFAQsOnly();
    return new AdminSuccessResponse('FAQs fetched successfully', faqs);
  }
} 