import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductModel } from '../models/product.schema';
import { CreateProductDto, UpdateProductDto, UpdateProductStatusDto } from '../enums/product.dto';
import { S3UploadService } from '../../common/services/s3-upload.service';

@Injectable()
export class ProductService {
  constructor(private readonly s3UploadService: S3UploadService) {}

  /**
   * Get all products with pagination
   */
  async getAllProducts(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { shortDescription: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [products, total] = await Promise.all([
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get single product by ID
   */
  async getProductById(id: string) {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  /**
   * Create new product
   */
  async createProduct(dto: CreateProductDto) {
    const product = await ProductModel.create({
      ...dto,
      status: dto.status || 'Draft',
      isPublished: dto.isPublished || false,
      images: dto.images || []
    });
    return product;
  }

  /**
   * Update product by ID
   */
  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    // Update only provided fields
    Object.keys(dto).forEach(key => {
      if (dto[key] !== undefined) {
        if (key === 'images') {
          // Filter out blob URLs and keep only AWS S3 URLs, remove duplicates
          const filteredImages = this.filterValidImages(dto[key]);
          product[key] = filteredImages;
        } else {
          product[key] = dto[key];
        }
      }
    });

    product.lastModified = new Date();
    await product.save();
    return product;
  }

  /**
   * Filter images to keep only AWS S3 URLs and remove duplicates
   */
  private filterValidImages(images: string[]): string[] {
    if (!images || !Array.isArray(images)) {
      return [];
    }

    // Filter out blob URLs and keep only AWS S3 URLs
    const validImages = images.filter(image => {
      return image && 
             typeof image === 'string' && 
             image.startsWith('https://') && 
             image.includes('s3.') &&
             !image.startsWith('blob:');
    });

    // Remove duplicates
    const uniqueImages = [...new Set(validImages)];

    return uniqueImages;
  }

  /**
   * Delete product by ID
   */
  async deleteProduct(id: string) {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    // Delete images from S3 if they exist
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        await this.s3UploadService.deleteFile(imageUrl);
      }
    }

    await ProductModel.findByIdAndDelete(id);
    return { id: product._id, deletedAt: new Date() };
  }

  /**
   * Upload product image
   */
  async uploadProductImage(file: Express.Multer.File): Promise<string> {
    return await this.s3UploadService.uploadFile(file, 'products');
  }

  /**
   * Add image to product
   */
  async addProductImage(id: string, imageUrl: string) {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    // Check if image already exists to prevent duplicates
    if (!product.images.includes(imageUrl)) {
      product.images.push(imageUrl);
    }
    
    product.lastModified = new Date();
    await product.save();
    
    return {
      id: product._id,
      imageUrl,
      uploadedAt: new Date()
    };
  }

  /**
   * Update product status
   */
  async updateProductStatus(id: string, dto: UpdateProductStatusDto) {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    product.status = dto.status;
    product.isPublished = dto.isPublished;
    product.lastModified = new Date();
    await product.save();

    return {
      id: product._id,
      status: product.status,
      isPublished: product.isPublished,
      updatedAt: product.updatedAt
    };
  }

  /**
   * Remove specific image from product
   */
  async removeProductImage(id: string, imageUrl: string) {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    // Remove the image from the array
    product.images = product.images.filter(img => img !== imageUrl);
    
    // Delete the image from S3
    await this.s3UploadService.deleteFile(imageUrl);
    
    product.lastModified = new Date();
    await product.save();

    return {
      id: product._id,
      removedImageUrl: imageUrl,
      remainingImages: product.images
    };
  }
} 