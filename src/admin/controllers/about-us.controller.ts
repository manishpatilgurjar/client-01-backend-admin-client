import { Controller, Get, Patch, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AboutUsService } from '../services/about-us.service';
import { UpdateAboutUsDto } from '../enums/about-us.dto';
import { AdminSuccessResponse } from '../enums/response';
import { AdminMessages } from '../enums/messages';

@Controller('admin/about-us')
export class AboutUsController {
  constructor(private readonly aboutUsService: AboutUsService) {}

  /**
   * GET /admin/about-us
   * Get About Us information
   */
  @Get()
  async get() {
    const about = await this.aboutUsService.get();
    return new AdminSuccessResponse(AdminMessages.ABOUT_US_FETCHED_SUCCESS, about);
  }

  /**
   * PATCH /admin/about-us
   * Update About Us information (creates if doesn't exist)
   */
  @Patch()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Body() dto: UpdateAboutUsDto) {
    const about = await this.aboutUsService.update(dto);
    return new AdminSuccessResponse(AdminMessages.ABOUT_US_UPDATED_SUCCESS, about);
  }
} 