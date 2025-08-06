import { Injectable, NotFoundException } from '@nestjs/common';
import { AboutUsModel } from '../../admin/models/about-us.schema';

@Injectable()
export class ClientAboutUsService {
  /**
   * Get About Us (read-only)
   */
  async get() {
    const about = await AboutUsModel.findOne();
    if (!about) throw new NotFoundException('About Us not found.');
    return about;
  }

  /**
   * Get About Us by ID
   */
  async getById(id: string) {
    const about = await AboutUsModel.findOne({ 
      _id: id
    });
    if (!about) throw new NotFoundException('About Us not found.');
    return about;
  }

  /**
   * Get all About Us entries
   */
  async getAll() {
    return await AboutUsModel.find().sort({ createdAt: -1 });
  }

  /**
   * Get About Us by title
   */
  async getByTitle(title: string) {
    const about = await AboutUsModel.findOne({ 
      mainTitle: { $regex: title, $options: 'i' }
    });
    if (!about) throw new NotFoundException('About Us not found.');
    return about;
  }

  /**
   * Get all About Us data in one shot (complete data)
   */
  async getAllAboutUsComplete() {
    const aboutUs = await AboutUsModel.find().sort({ createdAt: -1 });
    return aboutUs;
  }

  /**
   * Get main About Us data in one shot
   */
  async getMainAboutUsComplete() {
    const aboutUs = await AboutUsModel.findOne();
    if (!aboutUs) throw new NotFoundException('About Us not found.');
    return aboutUs;
  }
} 