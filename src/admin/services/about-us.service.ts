import { Injectable, NotFoundException } from '@nestjs/common';
import { AboutUsModel } from '../models/about-us.schema';
import { UpdateAboutUsDto } from '../enums/about-us.dto';
import { S3UploadService } from '../../common/services/s3-upload.service';

@Injectable()
export class AboutUsService {
  constructor(private readonly s3UploadService: S3UploadService) {}

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
  async update(dto: UpdateAboutUsDto, file?: Express.Multer.File) {
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
      return newAbout;
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

    // Update the section
    about.sections[sectionIndex] = { ...about.sections[sectionIndex], ...sectionData };
    about.markModified('sections');
    
    const updated = await about.save();
    return updated.sections[sectionIndex];
  }

  /**
   * Update individual team member by ID
   */
  async updateTeamMember(memberId: string, memberData: any) {
    const about = await AboutUsModel.findOne();
    if (!about) throw new NotFoundException('About Us not found.');

    const memberIndex = about.teamMembers.findIndex(member => member._id?.toString() === memberId);
    if (memberIndex === -1) throw new NotFoundException('Team member not found.');

    // Update the team member
    about.teamMembers[memberIndex] = { ...about.teamMembers[memberIndex], ...memberData };
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
} 