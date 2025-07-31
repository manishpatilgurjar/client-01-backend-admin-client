import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete,
  Body, 
  Param,
  UsePipes, 
  ValidationPipe
} from '@nestjs/common';
import { IndexPageService } from '../services/index-page.service';
import { 
  UpdateIndexPageDto, 
  CreateSectionDto, 
  UpdateSectionDto, 
  UpdateSectionStatusDto,
  UpdateFeaturedProductsDto
} from '../enums/index-page.dto';
import { AdminSuccessResponse } from '../enums/response';
import { AdminMessages } from '../enums/messages';

@Controller('admin/index-page')
export class IndexPageController {
  constructor(private readonly indexPageService: IndexPageService) {}

  /**
   * GET /admin/index-page
   * Get all index page sections
   */
  @Get()
  async getIndexPage() {
    const indexPage = await this.indexPageService.getIndexPage();
    return new AdminSuccessResponse(AdminMessages.INDEX_PAGE_FETCHED_SUCCESS, {
      pageId: indexPage.pageId,
      sections: indexPage.sections
    });
  }

  /**
   * PATCH /admin/index-page
   * Update index page
   */
  @Patch()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateIndexPage(@Body() dto: UpdateIndexPageDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const indexPage = await this.indexPageService.updateIndexPage(dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse(AdminMessages.INDEX_PAGE_UPDATED_SUCCESS, {
      pageId: indexPage.pageId,
      sections: indexPage.sections
    });
  }

  // ==================== SECTION ENDPOINTS ====================

  /**
   * GET /admin/index-page/sections
   * Get all sections
   */
  @Get('sections')
  async getAllSections() {
    const sections = await this.indexPageService.getAllSections();
    return new AdminSuccessResponse(AdminMessages.INDEX_PAGE_FETCHED_SUCCESS, sections);
  }

  /**
   * GET /admin/index-page/sections/:id
   * Get single section by ID
   */
  @Get('sections/:id')
  async getSection(@Param('id') id: string) {
    const section = await this.indexPageService.getSection(id);
    return new AdminSuccessResponse(AdminMessages.SECTION_FETCHED_SUCCESS, section);
  }

  /**
   * POST /admin/index-page/sections
   * Create new section
   */
  @Post('sections')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createSection(@Body() dto: CreateSectionDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const section = await this.indexPageService.createSectionWithValidation(dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse(AdminMessages.SECTION_CREATED_SUCCESS, section);
  }

  /**
   * PUT /admin/index-page/sections/:id
   * Update section
   */
  @Patch('sections/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateSection(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const section = await this.indexPageService.updateSectionWithValidation(id, dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse(AdminMessages.SECTION_UPDATED_SUCCESS, section);
  }

  /**
   * PATCH /admin/index-page/sections/:id/status
   * Update section status
   */
  @Patch('sections/:id/status')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateSectionStatus(@Param('id') id: string, @Body() dto: UpdateSectionStatusDto) {
    const section = await this.indexPageService.updateSectionStatus(id, dto);
    return new AdminSuccessResponse(AdminMessages.SECTION_STATUS_UPDATED_SUCCESS, section);
  }

  /**
   * DELETE /admin/index-page/sections/:id
   * Delete section
   */
  @Delete('sections/:id')
  async deleteSection(@Param('id') id: string) {
    // TODO: Get user info from JWT token when auth is implemented
    await this.indexPageService.deleteSection(id, 'admin', 'admin@example.com');
    return new AdminSuccessResponse(AdminMessages.SECTION_DELETED_SUCCESS);
  }

  /**
   * PATCH /admin/index-page/sections/:id/featured-products
   * Update featured products for a section
   */
  @Patch('sections/:id/featured-products')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateFeaturedProducts(@Param('id') id: string, @Body() dto: UpdateFeaturedProductsDto) {
    const result = await this.indexPageService.updateFeaturedProducts(id, dto);
    return new AdminSuccessResponse(AdminMessages.FEATURED_PRODUCTS_UPDATED_SUCCESS, result);
  }

  /**
   * POST /admin/index-page/sections/reorder
   * Reorder sections
   */
  @Post('sections/reorder')
  async reorderSections(@Body() body: { sectionIds: string[] }) {
    const sections = await this.indexPageService.reorderSections(body.sectionIds);
    return new AdminSuccessResponse('Sections reordered successfully', sections);
  }
} 