import { 
  Controller, 
  Get, 
  Param, 
  Query 
} from '@nestjs/common';
import { ClientAboutUsService } from '../services/about-us.service';
import { AdminSuccessResponse } from '../../admin/enums/response';

@Controller('api/client/about-us')
export class ClientAboutUsController {
  constructor(private readonly aboutUsService: ClientAboutUsService) {}

  /**
   * GET /api/about-us
   * Get the main About Us content
   */
  @Get()
  async getAboutUs() {
    const aboutUs = await this.aboutUsService.get();
    return new AdminSuccessResponse('About Us fetched successfully', aboutUs);
  }

  /**
   * GET /api/client/about-us/complete
   * Get all About Us data in one shot (complete data)
   */
  @Get('complete')
  async getAllAboutUsComplete() {
    const aboutUs = await this.aboutUsService.getAllAboutUsComplete();
    return new AdminSuccessResponse('All About Us data fetched successfully', aboutUs);
  }

  /**
   * GET /api/client/about-us/main
   * Get main About Us data in one shot
   */
  @Get('main')
  async getMainAboutUsComplete() {
    const aboutUs = await this.aboutUsService.getMainAboutUsComplete();
    return new AdminSuccessResponse('Main About Us data fetched successfully', aboutUs);
  }

  /**
   * GET /api/about-us/all
   * Get all About Us entries
   */
  @Get('all')
  async getAllAboutUs() {
    const aboutUsList = await this.aboutUsService.getAll();
    return new AdminSuccessResponse('About Us list fetched successfully', aboutUsList);
  }

  /**
   * GET /api/about-us/search
   * Search About Us by title
   */
  @Get('search')
  async searchAboutUs(@Query('title') title: string) {
    if (!title || title.trim() === '') {
      return new AdminSuccessResponse('Title parameter is required', null);
    }

    const aboutUs = await this.aboutUsService.getByTitle(title.trim());
    return new AdminSuccessResponse('About Us fetched successfully', aboutUs);
  }

  /**
   * GET /api/about-us/:id
   * Get About Us by ID
   */
  @Get(':id')
  async getAboutUsById(@Param('id') id: string) {
    const aboutUs = await this.aboutUsService.getById(id);
    return new AdminSuccessResponse('About Us fetched successfully', aboutUs);
  }
} 