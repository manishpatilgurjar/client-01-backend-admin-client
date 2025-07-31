import { Injectable, NotFoundException } from '@nestjs/common';
import { IndexPageModel, PageSection } from '../../admin/models/index-page.schema';

@Injectable()
export class ClientIndexPageService {

  /**
   * Get the complete index page with all sections (read-only)
   */
  async getIndexPage() {
    let indexPage = await IndexPageModel.findOne({ pageId: 'index-page' });
    
    if (!indexPage) {
      // Create default index page if it doesn't exist
      indexPage = await IndexPageModel.create({
        pageId: 'index-page',
        pageTitle: 'Homepage',
        sections: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0'
        }
      });
    }

    return indexPage;
  }

  /**
   * Get all sections (read-only)
   */
  async getAllSections() {
    const indexPage = await this.getIndexPage();
    return indexPage.sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Get a single section by ID (read-only)
   */
  async getSection(sectionId: string) {
    const indexPage = await this.getIndexPage();
    const section = indexPage.sections.find(s => s._id?.toString() === sectionId);
    
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return section;
  }
} 