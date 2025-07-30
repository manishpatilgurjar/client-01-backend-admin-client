import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AboutUsService } from './admin/services/about-us.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly aboutUsService: AboutUsService,
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
