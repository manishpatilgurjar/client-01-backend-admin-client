import { Injectable, NotFoundException } from '@nestjs/common';
import { PrivacyPolicyModel } from '../models/privacy-policy.schema';
import { UpdatePrivacyPolicyDto } from '../enums/privacy-policy.dto';

@Injectable()
export class PrivacyPolicyService {
  /**
   * Get Privacy Policy
   */
  async get() {
    const privacyPolicy = await PrivacyPolicyModel.findOne();
    if (!privacyPolicy) throw new NotFoundException('Privacy Policy not found.');
    return privacyPolicy;
  }

  /**
   * Update Privacy Policy (creates if doesn't exist)
   */
  async update(dto: UpdatePrivacyPolicyDto) {
    const privacyPolicy = await PrivacyPolicyModel.findOne();
    
    if (privacyPolicy) {
      // Update existing
      const updated = await PrivacyPolicyModel.findByIdAndUpdate(
        privacyPolicy._id, 
        dto, 
        { new: true }
      );
      return updated;
    } else {
      // Create new if doesn't exist
      const newPrivacyPolicy = await PrivacyPolicyModel.create({
        title: dto.title || 'Privacy Policy',
        policyDescription: dto.policyDescription || 'Privacy Policy description',
      });
      return newPrivacyPolicy;
    }
  }
} 