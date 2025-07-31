import { Injectable, NotFoundException } from '@nestjs/common';
import { FAQModel } from '../models/faq.schema';
import { CreateFAQDto, UpdateFAQDto, UpdateFAQStatusDto } from '../enums/faq.dto';

@Injectable()
export class FAQService {
  /**
   * Get all FAQs with pagination
   */
  async getAllFAQs(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { question: { $regex: search, $options: 'i' } },
          { answer: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [faqs, total] = await Promise.all([
      FAQModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FAQModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      faqs,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get single FAQ by ID
   */
  async getFAQById(id: string) {
    const faq = await FAQModel.findById(id);
    if (!faq) {
      throw new NotFoundException('FAQ not found.');
    }
    return faq;
  }

  /**
   * Create new FAQ
   */
  async createFAQ(dto: CreateFAQDto) {
    const faq = await FAQModel.create({
      ...dto,
      status: dto.status || 'Draft',
      isPublished: dto.isPublished || false
    });
    return faq;
  }

  /**
   * Update FAQ by ID
   */
  async updateFAQ(id: string, dto: UpdateFAQDto) {
    const faq = await FAQModel.findById(id);
    if (!faq) {
      throw new NotFoundException('FAQ not found.');
    }

    // Update only provided fields
    Object.keys(dto).forEach(key => {
      if (dto[key] !== undefined) {
        faq[key] = dto[key];
      }
    });

    await faq.save();
    return faq;
  }

  /**
   * Delete FAQ by ID
   */
  async deleteFAQ(id: string) {
    const faq = await FAQModel.findById(id);
    if (!faq) {
      throw new NotFoundException('FAQ not found.');
    }

    await FAQModel.findByIdAndDelete(id);
    return { id: faq._id, deletedAt: new Date() };
  }

  /**
   * Update FAQ status
   */
  async updateFAQStatus(id: string, dto: UpdateFAQStatusDto) {
    const faq = await FAQModel.findById(id);
    if (!faq) {
      throw new NotFoundException('FAQ not found.');
    }

    faq.status = dto.status;
    faq.isPublished = dto.isPublished;
    await faq.save();

    return faq;
  }
} 