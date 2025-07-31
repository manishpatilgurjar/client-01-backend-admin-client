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
} 