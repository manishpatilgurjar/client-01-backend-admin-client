import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientAboutUsService } from './client/services/about-us.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly aboutUsService: ClientAboutUsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * GET /about-us
   * Public endpoint to get About Us information
   */
  @Get('about-us')
  async getAboutUs() {
    const about = await this.aboutUsService.get();
    return {
      success: true,
      message: 'About Us fetched successfully',
      data: about,
    };
  }
}
