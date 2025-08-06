import { Injectable, NotFoundException } from '@nestjs/common';
import { SiteSettingsModel } from '../../admin/models/site-settings.schema';
import { FAQModel } from '../../admin/models/faq.schema';
import { EnquiryModel } from '../../admin/models/enquiry.schema';

@Injectable()
export class ClientContactUsService {

  /**
   * Get complete contact us data (site settings + FAQs)
   */
  async getContactUsData() {
    const [siteSettings, faqs] = await Promise.all([
      this.getSiteSettings(),
      this.getFAQs()
    ]);

    return {
      contactDetails: {
        siteName: siteSettings.siteName || 'Company Name',
        siteUrl: siteSettings.siteUrl || '',
        siteDescription: siteSettings.siteDescription || '',
        businessEmail: siteSettings.businessEmail || '',
        adminEmail: siteSettings.adminEmail || '',
        contactNumber: siteSettings.contactNumber || '',
        businessAddress: this.formatBusinessAddress(siteSettings.businessAddress),
        businessHours: siteSettings.businessHours || '',
        timezone: siteSettings.timezone || 'UTC',
        socialMedia: siteSettings.socialMedia || {},
        logoUrl: siteSettings.logoUrl || '',
        faviconUrl: siteSettings.faviconUrl || ''
      },
      faqs: faqs,
      inquiryCategories: this.getInquiryCategories()
    };
  }

  /**
   * Get site settings for contact details
   */
  private async getSiteSettings() {
    const settings = await SiteSettingsModel.findOne({ key: 'main' });
    if (!settings) {
      throw new NotFoundException('Site settings not found');
    }
    return settings;
  }

  /**
   * Get published FAQs
   */
  private async getFAQs() {
    return await FAQModel.find({
      isPublished: true,
      status: 'Published'
    }).select('question answer').sort({ createdAt: -1 });
  }

  /**
   * Format business address for better display
   */
  private formatBusinessAddress(address: any) {
    // Handle null, undefined, or empty address
    if (!address) {
      return {
        line1: '',
        line2: '',
        city: '',
        state: '',
        country: '',
        pinCode: '',
        fullAddress: 'Address not available'
      };
    }

    // Handle if address is stored as "[object Object]" string (database issue)
    if (typeof address === 'string') {
      if (address === '[object Object]' || address.trim() === '') {
        return {
          line1: '',
          line2: '',
          city: '',
          state: '',
          country: '',
          pinCode: '',
          fullAddress: 'Address not available'
        };
      }
      // If it's a valid string address, use it
      return {
        line1: address,
        line2: '',
        city: '',
        state: '',
        country: '',
        pinCode: '',
        fullAddress: address
      };
    }

    // Handle proper address object
    if (typeof address === 'object' && address !== null) {
      const line1 = address.line1 || '';
      const line2 = address.line2 || '';
      const city = address.city || '';
      const state = address.state || '';
      const country = address.country || '';
      const pinCode = address.pinCode || '';

      // Create full address from available parts
      const addressParts = [line1, line2, city, state, country, pinCode]
        .filter(part => part && part.trim() !== '');

      const fullAddress = addressParts.length > 0 
        ? addressParts.join(', ')
        : 'Address not available';

      return {
        line1,
        line2,
        city,
        state,
        country,
        pinCode,
        fullAddress
      };
    }

    // Fallback for any other case
    return {
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: '',
      pinCode: '',
      fullAddress: 'Address not available'
    };
  }

  /**
   * Get inquiry categories for contact form
   */
  private getInquiryCategories() {
    return [
      'General Inquiry',
      'Product Inquiry', 
      'Technical Support',
      'Sales Inquiry',
      'Partnership',
      'Other'
    ];
  }

  /**
   * Submit contact form (create enquiry)
   */
  async submitContactForm(contactData: {
    fullName: string;
    email: string;
    phone?: string;
    subject: string;
    inquiryCategory: string;
    message: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const enquiry = await EnquiryModel.create({
      fullName: contactData.fullName,
      email: contactData.email,
      phone: contactData.phone || '',
      subject: contactData.subject,
      inquiryCategory: contactData.inquiryCategory,
      message: contactData.message,
      status: 'new',
      isStarred: false,
      ipAddress: contactData.ipAddress,
      userAgent: contactData.userAgent
    });

    return enquiry;
  }

  /**
   * Get only contact details
   */
  async getContactDetails() {
    const siteSettings = await this.getSiteSettings();
    
    return {
      siteName: siteSettings.siteName || 'Company Name',
      siteUrl: siteSettings.siteUrl || '',
      siteDescription: siteSettings.siteDescription || '',
      businessEmail: siteSettings.businessEmail || '',
      adminEmail: siteSettings.adminEmail || '',
      contactNumber: siteSettings.contactNumber || '',
      businessAddress: this.formatBusinessAddress(siteSettings.businessAddress),
      businessHours: siteSettings.businessHours || '',
      timezone: siteSettings.timezone || 'UTC',
      socialMedia: siteSettings.socialMedia || {},
      logoUrl: siteSettings.logoUrl || '',
      faviconUrl: siteSettings.faviconUrl || ''
    };
  }

  /**
   * Get only FAQs
   */
  async getFAQsOnly() {
    return await this.getFAQs();
  }
} 