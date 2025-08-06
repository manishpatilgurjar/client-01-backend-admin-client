import { Injectable, NotFoundException } from '@nestjs/common';
import { PrivacyPolicyModel } from '../../admin/models/privacy-policy.schema';

@Injectable()
export class ClientPrivacyPolicyService {

  /**
   * Get Privacy Policy for public viewing
   */
  async getPrivacyPolicy() {
    const privacyPolicy = await PrivacyPolicyModel.findOne();
    
    if (!privacyPolicy) {
      // Return default privacy policy if none exists
      return {
        title: 'Privacy Policy',
        policyDescription: 'Privacy policy not yet configured. Please contact us for more information.',
        lastUpdated: new Date(),
        isConfigured: false
      };
    }

    return {
      title: privacyPolicy.title || 'Privacy Policy',
      policyDescription: privacyPolicy.policyDescription || '',
      lastUpdated: privacyPolicy.updatedAt || privacyPolicy.createdAt,
      createdAt: privacyPolicy.createdAt,
      isConfigured: true
    };
  }

  /**
   * Get privacy policy summary (title and last updated date only)
   */
  async getPrivacyPolicySummary() {
    const privacyPolicy = await PrivacyPolicyModel.findOne();
    
    if (!privacyPolicy) {
      return {
        title: 'Privacy Policy',
        lastUpdated: null,
        isConfigured: false,
        hasContent: false
      };
    }

    return {
      title: privacyPolicy.title || 'Privacy Policy',
      lastUpdated: privacyPolicy.updatedAt || privacyPolicy.createdAt,
      isConfigured: true,
      hasContent: Boolean(privacyPolicy.policyDescription && privacyPolicy.policyDescription.trim() !== '')
    };
  }

  /**
   * Get formatted privacy policy for display
   */
  async getFormattedPrivacyPolicy() {
    const privacyPolicy = await this.getPrivacyPolicy();
    
    // Format the policy description into sections if it contains HTML or markdown
    const formatPolicyDescription = (description: string) => {
      if (!description) return [];
      
      // Simple section splitting - you can enhance this based on your content format
      const sections = description.split(/\n\s*\n/).filter(section => section.trim() !== '');
      
      return sections.map((section, index) => ({
        id: `section-${index + 1}`,
        content: section.trim(),
        order: index + 1
      }));
    };

    return {
      ...privacyPolicy,
      sections: formatPolicyDescription(privacyPolicy.policyDescription),
      wordCount: privacyPolicy.policyDescription ? privacyPolicy.policyDescription.split(' ').length : 0
    };
  }
} 