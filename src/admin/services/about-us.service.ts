import { Injectable, NotFoundException } from '@nestjs/common';
import { AboutUsModel } from '../models/about-us.schema';
import { UpdateAboutUsDto } from '../enums/about-us.dto';

@Injectable()
export class AboutUsService {
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
  async update(dto: UpdateAboutUsDto) {
    const about = await AboutUsModel.findOne();
    
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
        title: dto.title || 'About Us',
        description: dto.description || 'About Us description',
      });
      return newAbout;
    }
  }
} 