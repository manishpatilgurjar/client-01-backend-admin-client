import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AboutUsModel } from '../models/about-us.schema';
import { CreateAboutUsDto, UpdateAboutUsDto } from '../enums/about-us.dto';

@Injectable()
export class AboutUsService {
  /**
   * Create About Us (only one allowed)
   */
  async create(dto: CreateAboutUsDto) {
    const existing = await AboutUsModel.findOne();
    if (existing) throw new BadRequestException('About Us already exists.');
    return AboutUsModel.create(dto);
  }

  /**
   * Get About Us (public or admin)
   */
  async get() {
    const about = await AboutUsModel.findOne();
    if (!about) throw new NotFoundException('About Us not found.');
    return about;
  }

  /**
   * Update About Us (by id)
   */
  async update(id: string, dto: UpdateAboutUsDto) {
    const about = await AboutUsModel.findByIdAndUpdate(id, dto, { new: true });
    if (!about) throw new NotFoundException('About Us not found.');
    return about;
  }

  /**
   * Delete About Us (by id)
   */
  async delete(id: string) {
    const about = await AboutUsModel.findByIdAndDelete(id);
    if (!about) throw new NotFoundException('About Us not found.');
    return about;
  }
} 