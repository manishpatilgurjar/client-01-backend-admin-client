import { Schema, model, Document } from 'mongoose';

export interface SiteSettings extends Document {
  key: string;
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  businessEmail: string;
  adminEmail: string;
  timezone: string;
  contactNumber: string;
  businessAddress: string;
  businessHours: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  logoUrl: string;
  faviconUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<SiteSettings>({
  key: { 
    type: String, 
    required: true, 
    unique: true, 
    default: 'main' 
  },
  siteName: { 
    type: String, 
    required: true 
  },
  siteUrl: { 
    type: String, 
    required: true 
  },
  siteDescription: { 
    type: String, 
    required: true 
  },
  businessEmail: { 
    type: String, 
    required: true 
  },
  adminEmail: { 
    type: String, 
    required: true 
  },
  timezone: { 
    type: String, 
    required: true, 
    default: 'UTC' 
  },
  contactNumber: { 
    type: String, 
    required: true 
  },
  businessAddress: { 
    type: String, 
    default: '' 
  },
  businessHours: { 
    type: String, 
    default: '' 
  },
  socialMedia: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
  logoUrl: { 
    type: String, 
    default: '' 
  },
  faviconUrl: { 
    type: String, 
    default: '' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true,
  collection: 'site_settings'
});

export const SiteSettingsModel = model<SiteSettings>('SiteSettings', SiteSettingsSchema); 