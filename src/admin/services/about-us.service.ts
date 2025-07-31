import { Injectable, NotFoundException } from '@nestjs/common';
import { AboutUsModel } from '../models/about-us.schema';
import { UpdateAboutUsDto } from '../enums/about-us.dto';
import { S3UploadService } from '../../common/services/s3-upload.service';
import { ActivityLogService } from './activity-log.service';

@Injectable()
export class AboutUsService {
  constructor(
    private readonly s3UploadService: S3UploadService,
    private readonly activityLogService: ActivityLogService
  ) {}

  /**
   * Get About Us
   */
  async get() {
    const about = await AboutUsModel.findOne();
    if (!about) throw new NotFoundException('About Us not found.');
    return about;
  }

  /**
   * Update About Us (creates if doesn't exist)
   */
  async update(dto: UpdateAboutUsDto, file?: Express.Multer.File, userId?: string, userEmail?: string) {
    const about = await AboutUsModel.findOne();
    
    // Handle main image upload if provided
    if (file) {
      const imageUrl = await this.s3UploadService.uploadFile(file, 'about-us');
      dto.mainImage = imageUrl;
    }
    
    if (about) {
      // Update existing
      const updated = await AboutUsModel.findByIdAndUpdate(
        about._id, 
        dto, 
        { new: true }
      );

      // Log the activity
      await this.activityLogService.logPageUpdated('About Us', userId, userEmail);

      return updated;
    } else {
      // Create new if doesn't exist
      const newAbout = await AboutUsModel.create({
        mainTitle: dto.mainTitle || 'About Us',
        mainDescription: dto.mainDescription || 'About Us description',
        mainImage: dto.mainImage,
        sections: dto.sections || [],
        teamMembers: dto.teamMembers || [],
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        address: dto.address,
        socialLinks: dto.socialLinks,
      });

      // Log the activity
      await this.activityLogService.logActivity({
        action: 'About Us Created',
        entity: 'Page',
        entityName: 'About Us',
        userId,
        userEmail,
        type: 'create'
      });

      return newAbout;
    }
  }

  /**
   * Upload main about us image
   */
  async uploadMainImage(file: Express.Multer.File): Promise<string> {
    return await this.s3UploadService.uploadFile(file, 'about-main');
  }

  /**
   * Update main image URL in database
   */
  async updateMainImage(imageUrl: string) {
    const about = await AboutUsModel.findOne();
    if (!about) {
      // Create new About Us if doesn't exist
      await AboutUsModel.create({
        mainTitle: 'About Us',
        mainDescription: 'About Us description',
        mainImage: imageUrl,
      });
    } else {
      // Update existing About Us
      about.mainImage = imageUrl;
      await about.save();
    }
  }

  /**
   * Upload team member image
   */
  async uploadTeamMemberImage(file: Express.Multer.File): Promise<string> {
    return await this.s3UploadService.uploadFile(file, 'team-members');
  }

  /**
   * Upload section image
   */
  async uploadSectionImage(file: Express.Multer.File): Promise<string> {
    return await this.s3UploadService.uploadFile(file, 'about-sections');
  }

  /**
   * Delete image from S3
   */
  async deleteImage(imageUrl: string): Promise<void> {
    await this.s3UploadService.deleteFile(imageUrl);
  }

  /**
   * Update individual section by ID
   */
  async updateSection(sectionId: string, sectionData: any) {
    const about = await AboutUsModel.findOne();
    if (!about) throw new NotFoundException('About Us not found.');

    const sectionIndex = about.sections.findIndex(section => section._id?.toString() === sectionId);
    if (sectionIndex === -1) throw new NotFoundException('Section not found.');

    // Extract only the actual data fields from the Mongoose subdocument
    const currentSection = {
      title: about.sections[sectionIndex].title,
      content: about.sections[sectionIndex].content,
      order: about.sections[sectionIndex].order,
      image: about.sections[sectionIndex].image,
      _id: about.sections[sectionIndex]._id
    };
    
    // Update the section - only update fields that are not undefined
    const updatedSection = { ...currentSection };
    Object.keys(sectionData).forEach(key => {
      if (sectionData[key] !== undefined) {
        updatedSection[key] = sectionData[key];
      }
    });
    
    about.sections[sectionIndex] = updatedSection;
    about.markModified('sections');
    
    const updated = await about.save();
    return updated.sections[sectionIndex];
  }

  /**
   * Update individual team member by ID
   */
  async updateTeamMember(memberId: string, memberData: any) {
    const about = await AboutUsModel.findOne();
    if (!about) {
      throw new NotFoundException('About Us not found.');
    }

    const memberIndex = about.teamMembers.findIndex(member => member._id?.toString() === memberId);
    if (memberIndex === -1) {
      throw new NotFoundException('Team member not found.');
    }

    // Extract only the actual data fields from the Mongoose subdocument
    const currentMember = {
      name: about.teamMembers[memberIndex].name,
      position: about.teamMembers[memberIndex].position,
      bio: about.teamMembers[memberIndex].bio,
      email: about.teamMembers[memberIndex].email,
      order: about.teamMembers[memberIndex].order,
      image: about.teamMembers[memberIndex].image,
      linkedin: about.teamMembers[memberIndex].linkedin,
      twitter: about.teamMembers[memberIndex].twitter,
      _id: about.teamMembers[memberIndex]._id
    };
    
    // Update the team member - only update fields that are not undefined
    const updatedMember = { ...currentMember };
    Object.keys(memberData).forEach(key => {
      if (memberData[key] !== undefined) {
        updatedMember[key] = memberData[key];
      }
    });
    
    about.teamMembers[memberIndex] = updatedMember;
    about.markModified('teamMembers');
    
    const updated = await about.save();
    return updated.teamMembers[memberIndex];
  }

  /**
   * Delete section by ID
   */
  async deleteSection(sectionId: string) {
    const about = await AboutUsModel.findOne();
    if (!about) throw new NotFoundException('About Us not found.');

    const sectionIndex = about.sections.findIndex(section => section._id?.toString() === sectionId);
    if (sectionIndex === -1) throw new NotFoundException('Section not found.');

    // Delete image if exists
    if (about.sections[sectionIndex].image) {
      await this.s3UploadService.deleteFile(about.sections[sectionIndex].image);
    }

    about.sections.splice(sectionIndex, 1);
    about.markModified('sections');
    
    await about.save();
    return { message: 'Section deleted successfully' };
  }

  /**
   * Delete team member by ID
   */
  async deleteTeamMember(memberId: string) {
    const about = await AboutUsModel.findOne();
    if (!about) throw new NotFoundException('About Us not found.');

    const memberIndex = about.teamMembers.findIndex(member => member._id?.toString() === memberId);
    if (memberIndex === -1) throw new NotFoundException('Team member not found.');

    // Delete image if exists
    if (about.teamMembers[memberIndex].image) {
      await this.s3UploadService.deleteFile(about.teamMembers[memberIndex].image);
    }

    about.teamMembers.splice(memberIndex, 1);
    about.markModified('teamMembers');
    
    await about.save();
    return { message: 'Team member deleted successfully' };
  }

  /**
   * Get section by ID
   */
  async getSection(sectionId: string) {
    const about = await AboutUsModel.findOne();
    if (!about) throw new NotFoundException('About Us not found.');

    const section = about.sections.find(section => section._id?.toString() === sectionId);
    if (!section) throw new NotFoundException('Section not found.');

    return section;
  }

  /**
   * Get team member by ID
   */
  async getTeamMember(memberId: string) {
    const about = await AboutUsModel.findOne();
    if (!about) throw new NotFoundException('About Us not found.');

    const member = about.teamMembers.find(member => member._id?.toString() === memberId);
    if (!member) throw new NotFoundException('Team member not found.');

    return member;
  }

  /**
   * Add new team member
   */
  async addTeamMember(memberData: any) {
    const about = await AboutUsModel.findOne();
    if (!about) {
      // Create new About Us if doesn't exist
      const newAbout = await AboutUsModel.create({
        mainTitle: 'About Us',
        mainDescription: 'About Us description',
        teamMembers: [memberData],
      });
      return newAbout.teamMembers[0];
    }

    // Add to existing team members
    about.teamMembers.push(memberData);
    about.markModified('teamMembers');
    
    const updated = await about.save();
    return updated.teamMembers[updated.teamMembers.length - 1];
  }

  /**
   * Add new section
   */
  async addSection(sectionData: any) {
    const about = await AboutUsModel.findOne();
    if (!about) {
      // Create new About Us if doesn't exist
      const newAbout = await AboutUsModel.create({
        mainTitle: 'About Us',
        mainDescription: 'About Us description',
        sections: [sectionData],
      });
      return newAbout.sections[0];
    }

    // Add to existing sections
    about.sections.push(sectionData);
    about.markModified('sections');
    
    const updated = await about.save();
    return updated.sections[updated.sections.length - 1];
  }
} 