import { Injectable, NotFoundException } from '@nestjs/common';
import { IndexPageModel, PageSection } from '../../admin/models/index-page.schema';
import { ProductModel } from '../../admin/models/product.schema';

@Injectable()
export class ClientIndexPageService {

  /**
   * Helper method to populate featured products for a section
   */
  private async populateFeaturedProducts(section: any) {
    if (section.content && section.content.featuredProducts && section.content.featuredProducts.length > 0) {
      try {
        const populatedProducts = await ProductModel.find({
          _id: { $in: section.content.featuredProducts },
          isPublished: true,
          status: 'Published'
        }).select('name shortDescription images category createdAt');
        
        return {
          ...section,
          content: {
            ...section.content,
            featuredProducts: populatedProducts.map(product => ({
              _id: product._id,
              name: product.name,
              shortDescription: product.shortDescription,
              images: product.images,
              category: product.category
            }))
          }
        };
      } catch (error) {
        console.error('Error populating featured products for section:', section.name, error);
        return {
          ...section,
          content: {
            ...section.content,
            featuredProducts: []
          }
        };
      }
    }
    return section;
  }

  /**
   * Get the complete index page with all sections and populated featured products (read-only)
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

    // Convert to plain object first
    const indexPageObj = indexPage.toObject();

    // Populate featured products for each section
    const populatedSections = await Promise.all(
      indexPageObj.sections.map(async (section) => {
        return await this.populateFeaturedProducts(section);
      })
    );

    return {
      ...indexPageObj,
      sections: populatedSections.sort((a, b) => a.order - b.order)
    };
  }

  /**
   * Get all active sections with populated featured products (read-only)
   */
  async getAllSections() {
    const indexPage = await this.getIndexPage();
    return indexPage.sections.filter(section => section.isActive && section.status === 'Active');
  }

  /**
   * Get a single section by ID with populated featured products (read-only)
   */
  async getSection(sectionId: string) {
    const indexPage = await this.getIndexPage();
    const section = indexPage.sections.find(s => s._id?.toString() === sectionId);
    
    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (!section.isActive || section.status !== 'Active') {
      throw new NotFoundException('Section is not active');
    }

    // Ensure featured products are populated
    return await this.populateFeaturedProducts(section);
  }

  /**
   * Get sections by name (read-only)
   */
  async getSectionsByName(sectionNames: string[]) {
    const indexPage = await this.getIndexPage();
    return indexPage.sections.filter(section => 
      sectionNames.includes(section.name) && 
      section.isActive && 
      section.status === 'Active'
    );
  }

  /**
   * Get featured products section specifically
   */
  async getFeaturedProductsSection() {
    const sections = await this.getAllSections();
    return sections.find(section => section.name === 'Featured Products');
  }

  /**
   * Get hero section specifically
   */
  async getHeroSection() {
    const sections = await this.getAllSections();
    return sections.find(section => section.name === 'Hero Section');
  }

  /**
   * Get about section specifically
   */
  async getAboutSection() {
    const sections = await this.getAllSections();
    return sections.find(section => section.name === 'About Section');
  }

  /**
   * Get contact section specifically
   */
  async getContactSection() {
    const sections = await this.getAllSections();
    return sections.find(section => section.name === 'Contact Information');
  }
} 