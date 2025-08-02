import { IndexPageModel } from '../models/index-page.schema';

export const seedIndexPage = async () => {
  try {
    // Check if index page already exists
    const existingIndexPage = await IndexPageModel.findOne({ pageId: 'index-page' });
    
    if (existingIndexPage) {
  
      return;
    }

    // Create default index page with sample sections
    const indexPageData = {
      pageId: 'index-page',
      pageTitle: 'Homepage',
      sections: [
        {
          name: 'Hero Section',
          description: 'Main banner with company branding',
          status: 'Active',
          lastModified: new Date(),
          content: {
            title: 'Advanced Medical Technology',
            subtitle: 'MedoScopic Pharma',
            description: 'Leading the future of medical diagnostics with innovative solutions that improve patient outcomes and healthcare efficiency.',
            buttonText: 'Explore Products',
            buttonLink: '/products'
          },
          isActive: true,
          order: 1
        },
        {
          name: 'About Section',
          description: 'Company overview and mission',
          status: 'Active',
          lastModified: new Date(),
          content: {
            title: 'About MedoScopic',
            subtitle: 'Innovation in Healthcare',
            description: 'We are dedicated to developing cutting-edge medical technologies that enhance diagnostic accuracy and improve patient care worldwide.',
            buttonText: 'Learn More',
            buttonLink: '/about'
          },
          isActive: true,
          order: 2
        },
        {
          name: 'Featured Products',
          description: 'Showcase 4 selected products',
          status: 'Active',
          lastModified: new Date(),
          content: {
            title: 'Featured Products',
            subtitle: 'Our Best Solutions',
            description: 'Discover our most popular medical technologies',
            buttonText: 'View All Products',
            buttonLink: '/products',
            featuredProducts: []
          },
          isActive: true,
          order: 3
        },
        {
          name: 'Services Overview',
          description: 'Brief overview of services offered',
          status: 'Draft',
          lastModified: new Date(),
          content: {
            title: 'Our Services',
            subtitle: 'Comprehensive Medical Solutions',
            description: 'From diagnostic equipment to pharmaceutical solutions, we provide comprehensive medical technologies for healthcare providers.',
            buttonText: 'View Services',
            buttonLink: '/services'
          },
          isActive: false,
          order: 4
        },
        {
          name: 'Contact Information',
          description: 'Contact details and location',
          status: 'Active',
          lastModified: new Date(),
          content: {
            title: 'Get in Touch',
            subtitle: 'Contact Our Team',
            description: 'Ready to learn more about our products? Contact our expert team for personalized consultation and support.',
            buttonText: 'Contact Us',
            buttonLink: '/contact'
          },
          isActive: true,
          order: 5
        }
      ],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0'
      }
    };

    await IndexPageModel.create(indexPageData);

  } catch (error) {
    console.error('Error seeding index page:', error);
  }
}; 