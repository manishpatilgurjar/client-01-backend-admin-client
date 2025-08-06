import { Injectable, NotFoundException } from '@nestjs/common';
import { SiteSettingsModel } from '../../admin/models/site-settings.schema';

@Injectable()
export class ClientSiteSettingsService {

  /**
   * Get site settings (read-only)
   */
  async get() {
    const settings = await SiteSettingsModel.findOne({ key: 'main' });
    if (!settings) throw new NotFoundException('Site settings not found.');
    return settings;
  }

  /**
   * Get all site settings
   */
  async getAll() {
    return await SiteSettingsModel.find().sort({ createdAt: -1 });
  }

  /**
   * Get site settings by key
   */
  async getByKey(key: string) {
    const settings = await SiteSettingsModel.findOne({ key });
    if (!settings) throw new NotFoundException('Site settings not found.');
    return settings;
  }

  /**
   * Get footer data (company address, contact details, social media links)
   */
  async getFooterData() {
    const settings = await SiteSettingsModel.findOne({ key: 'main' });
    if (!settings) {
      throw new NotFoundException('Site settings not found.');
    }

    // Format business address for footer display
    const formatBusinessAddress = (address: any) => {
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
    };

    return {
      companyInfo: {
        siteName: settings.siteName || 'Company Name',
        siteDescription: settings.siteDescription || '',
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || ''
      },
      contactDetails: {
        businessEmail: settings.businessEmail || '',
        contactNumber: settings.contactNumber || '',
        businessHours: settings.businessHours || '',
        timezone: settings.timezone || 'UTC'
      },
      address: formatBusinessAddress(settings.businessAddress),
      socialMedia: {
        facebook: settings.socialMedia?.facebook || '',
        twitter: settings.socialMedia?.twitter || '',
        instagram: settings.socialMedia?.instagram || '',
        linkedin: settings.socialMedia?.linkedin || ''
      },
      links: {
        siteUrl: settings.siteUrl || '',
        adminEmail: settings.adminEmail || ''
      }
    };
  }
} 