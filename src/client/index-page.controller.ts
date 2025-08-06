import { 
  Controller, 
  Get, 
  Param,
  Query
} from '@nestjs/common';
import { ClientIndexPageService } from './services/index-page.service';
import { AdminSuccessResponse } from '../admin/enums/response';
import { AdminMessages } from '../admin/enums/messages';

@Controller('api/client/index-page')
export class ClientIndexPageController {
  constructor(private readonly indexPageService: ClientIndexPageService) {}

  /**
   * GET /api/index-page
   * Get complete index page with all active sections and populated featured products
   */
  @Get()
  async getIndexPage() {
    const indexPage = await this.indexPageService.getIndexPage();
    return new AdminSuccessResponse(AdminMessages.INDEX_PAGE_FETCHED_SUCCESS, {
      pageId: indexPage.pageId,
      pageTitle: indexPage.pageTitle,
      sections: indexPage.sections,
      metadata: indexPage.metadata
    });
  }

  /**
   * GET /api/index-page/sections
   * Get all active sections with populated featured products
   */
  @Get('sections')
  async getAllSections() {
    const sections = await this.indexPageService.getAllSections();
    return new AdminSuccessResponse(AdminMessages.INDEX_PAGE_FETCHED_SUCCESS, sections);
  }

  /**
   * GET /api/index-page/sections/:id
   * Get single section by ID with populated featured products
   */
  @Get('sections/:id')
  async getSection(@Param('id') id: string) {
    const section = await this.indexPageService.getSection(id);
    return new AdminSuccessResponse(AdminMessages.SECTION_FETCHED_SUCCESS, section);
  }

  /**
   * GET /api/index-page/hero
   * Get hero section specifically
   */
  @Get('hero')
  async getHeroSection() {
    const heroSection = await this.indexPageService.getHeroSection();
    if (!heroSection) {
      return new AdminSuccessResponse('Hero section not found', null);
    }
    return new AdminSuccessResponse('Hero section fetched successfully', heroSection);
  }

  /**
   * GET /api/index-page/about
   * Get about section specifically
   */
  @Get('about')
  async getAboutSection() {
    const aboutSection = await this.indexPageService.getAboutSection();
    if (!aboutSection) {
      return new AdminSuccessResponse('About section not found', null);
    }
    return new AdminSuccessResponse('About section fetched successfully', aboutSection);
  }

  /**
   * GET /api/index-page/featured-products
   * Get featured products section specifically
   */
  @Get('featured-products')
  async getFeaturedProductsSection() {
    const featuredSection = await this.indexPageService.getFeaturedProductsSection();
    if (!featuredSection) {
      return new AdminSuccessResponse('Featured products section not found', null);
    }
    return new AdminSuccessResponse('Featured products section fetched successfully', featuredSection);
  }

  /**
   * GET /api/index-page/contact
   * Get contact section specifically
   */
  @Get('contact')
  async getContactSection() {
    const contactSection = await this.indexPageService.getContactSection();
    if (!contactSection) {
      return new AdminSuccessResponse('Contact section not found', null);
    }
    return new AdminSuccessResponse('Contact section fetched successfully', contactSection);
  }

  /**
   * GET /api/index-page/sections-by-name
   * Get specific sections by name (comma-separated)
   */
  @Get('sections-by-name')
  async getSectionsByName(@Query('names') names: string) {
    if (!names) {
      return new AdminSuccessResponse('No section names provided', []);
    }
    
    const sectionNames = names.split(',').map(name => name.trim());
    const sections = await this.indexPageService.getSectionsByName(sectionNames);
    return new AdminSuccessResponse('Sections fetched successfully', sections);
  }
} 