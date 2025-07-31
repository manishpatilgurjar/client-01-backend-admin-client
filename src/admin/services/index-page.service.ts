import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { IndexPageModel, PageSection } from '../models/index-page.schema';
import { ProductModel } from '../models/product.schema';
import { UpdateIndexPageDto, CreateSectionDto, UpdateSectionDto, UpdateSectionStatusDto, UpdateFeaturedProductsDto } from '../enums/index-page.dto';
import { Types } from 'mongoose';
import { ActivityLogService } from './activity-log.service';

@Injectable()
export class IndexPageService {
  constructor(private readonly activityLogService: ActivityLogService) {}

  /**
   * Get the complete index page with all sections
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
   * Update the index page
   */
  async updateIndexPage(dto: UpdateIndexPageDto, userId?: string, userEmail?: string) {
    const indexPage = await IndexPageModel.findOne({ pageId: 'index-page' });
    
    if (!indexPage) {
      throw new NotFoundException('Index page not found');
    }

    // Update fields if provided
    if (dto.pageTitle) {
      indexPage.pageTitle = dto.pageTitle;
    }

    if (dto.sections) {
      indexPage.sections = dto.sections.map((section, index) => ({
        ...section,
        order: section.order ?? index + 1,
        lastModified: new Date(),
        status: section.status ?? (section.isActive ? 'Active' : 'Draft'),
        isActive: section.isActive ?? true,
        content: {
          ...section.content!,
          featuredProducts: section.content?.featuredProducts?.map(id => new Types.ObjectId(id)) || []
        }
      }));
    }

    // Update metadata
    indexPage.metadata.updatedAt = new Date();

    const savedPage = await indexPage.save();

    // Log the activity
    await this.activityLogService.logPageUpdated('Index Page', userId, userEmail);

    return savedPage;
  }

  /**
   * Get all sections
   */
  async getAllSections() {
    const indexPage = await this.getIndexPage();
    return indexPage.sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Get a single section by ID
   */
  async getSection(sectionId: string) {
    const indexPage = await this.getIndexPage();
    const section = indexPage.sections.find(s => s._id?.toString() === sectionId);
    
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return section;
  }

  /**
   * Create a new section
   */
  async createSection(dto: CreateSectionDto, userId?: string, userEmail?: string) {
    const indexPage = await this.getIndexPage();
    
    // Determine the order if not provided
    const order = dto.order ?? indexPage.sections.length + 1;
    
    const newSection = {
      name: dto.name,
      description: dto.description,
      status: dto.status ?? (dto.isActive ? 'Active' : 'Draft'),
      lastModified: new Date(),
      content: {
        ...dto.content,
        featuredProducts: dto.content.featuredProducts?.map(id => new Types.ObjectId(id)) || []
      },
      isActive: dto.isActive ?? true,
      order: order
    };

    indexPage.sections.push(newSection);
    
    // Sort sections by order
    indexPage.sections.sort((a, b) => a.order - b.order);
    
    // Update metadata
    indexPage.metadata.updatedAt = new Date();
    
    await indexPage.save();
    
    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Section Created',
      entity: 'Page',
      entityName: `${dto.name} Section`,
      userId,
      userEmail,
      type: 'create'
    });
    
    return newSection;
  }

  /**
   * Update a section
   */
  async updateSection(sectionId: string, dto: UpdateSectionDto, userId?: string, userEmail?: string) {
    const indexPage = await this.getIndexPage();
    const sectionIndex = indexPage.sections.findIndex(s => s._id?.toString() === sectionId);
    
    if (sectionIndex === -1) {
      throw new NotFoundException('Section not found');
    }

    const section = indexPage.sections[sectionIndex];
    
    // Update fields if provided
    if (dto.name) section.name = dto.name;
    if (dto.description) section.description = dto.description;
    if (dto.status) section.status = dto.status;
    if (dto.isActive !== undefined) section.isActive = dto.isActive;
    if (dto.order !== undefined) section.order = dto.order;
    if (dto.content) {
      section.content = {
        ...dto.content,
        featuredProducts: dto.content.featuredProducts?.map(id => new Types.ObjectId(id)) || section.content.featuredProducts
      };
    }
    
    // Update lastModified
    section.lastModified = new Date();
    
    // Sort sections by order
    indexPage.sections.sort((a, b) => a.order - b.order);
    
    // Update metadata
    indexPage.metadata.updatedAt = new Date();
    
    await indexPage.save();
    
    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Section Updated',
      entity: 'Page',
      entityName: `${section.name} Section`,
      userId,
      userEmail,
      type: 'update'
    });
    
    return section;
  }

  /**
   * Update section status
   */
  async updateSectionStatus(sectionId: string, dto: UpdateSectionStatusDto) {
    const indexPage = await this.getIndexPage();
    const sectionIndex = indexPage.sections.findIndex(s => s._id?.toString() === sectionId);
    
    if (sectionIndex === -1) {
      throw new NotFoundException('Section not found');
    }

    const section = indexPage.sections[sectionIndex];
    
    // Update isActive
    section.isActive = dto.isActive;
    
    // Automatically set status based on isActive
    if (dto.isActive === true) {
      section.status = 'Active';
    } else if (dto.isActive === false) {
      section.status = 'Draft';
    }
    
    // If status is explicitly provided, use it (but still respect isActive logic)
    if (dto.status) {
      section.status = dto.status;
    }
    
    section.lastModified = new Date();
    
    // Update metadata
    indexPage.metadata.updatedAt = new Date();
    
    await indexPage.save();
    
    return section;
  }

  /**
   * Delete a section
   */
  async deleteSection(sectionId: string, userId?: string, userEmail?: string) {
    const indexPage = await this.getIndexPage();
    const sectionIndex = indexPage.sections.findIndex(s => s._id?.toString() === sectionId);
    
    if (sectionIndex === -1) {
      throw new NotFoundException('Section not found');
    }

    const sectionToDelete = indexPage.sections[sectionIndex];
    
    // Remove the section
    indexPage.sections.splice(sectionIndex, 1);
    
    // Reorder remaining sections
    indexPage.sections.forEach((section, index) => {
      section.order = index + 1;
    });
    
    // Update metadata
    indexPage.metadata.updatedAt = new Date();
    
    await indexPage.save();
    
    // Log the activity
    await this.activityLogService.logActivity({
      action: 'Section Deleted',
      entity: 'Page',
      entityName: `${sectionToDelete.name} Section`,
      userId,
      userEmail,
      type: 'delete'
    });
  }

  /**
   * Reorder sections
   */
  async reorderSections(sectionIds: string[]) {
    const indexPage = await this.getIndexPage();
    
    // Validate that all section IDs exist
    const existingSectionIds = indexPage.sections.map(s => s._id?.toString()).filter(Boolean);
    const invalidIds = sectionIds.filter(id => !existingSectionIds.includes(id));
    
    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid section IDs: ${invalidIds.join(', ')}`);
    }

    // Reorder sections
    const reorderedSections: any[] = [];
    
    sectionIds.forEach((sectionId, index) => {
      const section = indexPage.sections.find(s => s._id?.toString() === sectionId);
      if (section) {
        section.order = index + 1;
        section.lastModified = new Date();
        reorderedSections.push(section);
      }
    });

    indexPage.sections = reorderedSections;
    indexPage.metadata.updatedAt = new Date();
    
    await indexPage.save();
    
    return indexPage.sections;
  }

  /**
   * Validate that all product IDs exist
   */
  private async validateProductIds(productIds: string[]): Promise<void> {
    if (!productIds || productIds.length === 0) return;

    // Convert string IDs to ObjectIds
    const objectIds = productIds.map(id => new Types.ObjectId(id));

    const existingProducts = await ProductModel.find({
      _id: { $in: objectIds }
    });

    if (existingProducts.length !== productIds.length) {
      const existingIds = existingProducts.map(p => (p._id as any).toString());
      const missingIds = productIds.filter(id => !existingIds.includes(id));
      throw new NotFoundException(`Product with ID ${missingIds[0]} does not exist`);
    }
  }

  /**
   * Check if section name already exists
   */
  private async checkSectionNameExists(name: string, excludeId?: string): Promise<void> {
    const indexPage = await this.getIndexPage();
    const existingSection = indexPage.sections.find(s => 
      s.name === name && (!excludeId || s._id?.toString() !== excludeId)
    );
    
    if (existingSection) {
      throw new ConflictException(`Section '${name}' already exists`);
    }
  }

  /**
   * Create a new section with validation
   */
  async createSectionWithValidation(dto: CreateSectionDto, userId?: string, userEmail?: string) {
    // Check if section name already exists
    await this.checkSectionNameExists(dto.name);

    // Validate featured products if this is a Featured Products section
    if (dto.name === 'Featured Products' && dto.content.featuredProducts) {
      if (dto.content.featuredProducts.length > 4) {
        throw new BadRequestException('Featured products array must have max 4 product IDs');
      }
      await this.validateProductIds(dto.content.featuredProducts);
    }

    // Automatically set status based on isActive
    if (dto.isActive === true) {
      dto.status = 'Active';
    } else if (dto.isActive === false) {
      dto.status = 'Draft';
    }

    return await this.createSection(dto, userId, userEmail);
  }

  /**
   * Update section with validation
   */
  async updateSectionWithValidation(sectionId: string, dto: UpdateSectionDto, userId?: string, userEmail?: string) {
    const indexPage = await this.getIndexPage();
    const section = indexPage.sections.find(s => s._id?.toString() === sectionId);
    
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    // Check if section name already exists (if name is being changed)
    if (dto.name && dto.name !== section.name) {
      await this.checkSectionNameExists(dto.name, sectionId);
    }

    // Validate featured products if this is a Featured Products section
    if (dto.content?.featuredProducts) {
      if (dto.content.featuredProducts.length > 4) {
        throw new BadRequestException('Featured products array must have max 4 product IDs');
      }
      await this.validateProductIds(dto.content.featuredProducts);
    }

    // Automatically set status based on isActive
    if (dto.isActive === true) {
      dto.status = 'Active';
    } else if (dto.isActive === false) {
      dto.status = 'Draft';
    }

    return await this.updateSection(sectionId, dto, userId, userEmail);
  }

  /**
   * Update featured products for a section
   */
  async updateFeaturedProducts(sectionId: string, dto: UpdateFeaturedProductsDto) {
    const indexPage = await this.getIndexPage();
    const sectionIndex = indexPage.sections.findIndex(s => s._id?.toString() === sectionId);
    
    if (sectionIndex === -1) {
      throw new NotFoundException('Section not found');
    }

    const section = indexPage.sections[sectionIndex];
    
    // Check if this is a Featured Products section
    if (section.name !== 'Featured Products') {
      throw new BadRequestException('This endpoint is only available for Featured Products sections');
    }

    // Validate product IDs
    await this.validateProductIds(dto.featuredProducts);

    // Update featured products
    section.content.featuredProducts = dto.featuredProducts.map(id => new Types.ObjectId(id));
    section.lastModified = new Date();
    
    // Update metadata
    indexPage.metadata.updatedAt = new Date();
    
    await indexPage.save();
    
    return {
      id: section._id,
      featuredProducts: section.content.featuredProducts,
      lastModified: section.lastModified
    };
  }
} 