import { 
  Controller, 
  Get, 
  Param
} from '@nestjs/common';
import { ClientIndexPageService } from './services/index-page.service';
import { AdminSuccessResponse } from '../admin/enums/response';
import { AdminMessages } from '../admin/enums/messages';

@Controller('api/index-page')
export class ClientIndexPageController {
  constructor(private readonly indexPageService: ClientIndexPageService) {}

  /**
   * GET /api/index-page
   * Get all index page sections (public API)
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
   * GET /api/index-page/sections
   * Get all sections (public API)
   */
  @Get('sections')
  async getAllSections() {
    const sections = await this.indexPageService.getAllSections();
    return new AdminSuccessResponse(AdminMessages.INDEX_PAGE_FETCHED_SUCCESS, sections);
  }

  /**
   * GET /api/index-page/sections/:id
   * Get single section by ID (public API)
   */
  @Get('sections/:id')
  async getSection(@Param('id') id: string) {
    const section = await this.indexPageService.getSection(id);
    return new AdminSuccessResponse(AdminMessages.SECTION_FETCHED_SUCCESS, section);
  }
} 