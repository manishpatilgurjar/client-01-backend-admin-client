import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductModel } from '../../admin/models/product.schema';

@Injectable()
export class ClientProductService {

  /**
   * Get all published products
   */
  async getAllProducts() {
    return await ProductModel.find({
      isPublished: true,
      status: 'Published'
    }).select('name shortDescription images category createdAt');
  }

  /**
   * Get all products in one shot (complete details)
   */
  async getAllProductsComplete() {
    return await ProductModel.find({
      isPublished: true,
      status: 'Published'
    }).sort({ createdAt: -1 });
  }

  /**
   * Get all products with specific fields only
   */
  async getAllProductsSpecific() {
    return await ProductModel.find({
      isPublished: true,
      status: 'Published'
    })
    .select('_id name category shortDescription features images')
    .sort({ createdAt: -1 });
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string) {
    const product = await ProductModel.findOne({
      _id: productId,
      isPublished: true,
      status: 'Published'
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Get product by ID with specific fields only
   */
  async getProductByIdSpecific(productId: string) {
    const product = await ProductModel.findOne({
      _id: productId,
      isPublished: true,
      status: 'Published'
    }).select('_id name category shortDescription fullDescription features images');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Get product recommendations (4 similar products)
   */
  async getProductRecommendations(productId: string, limit: number = 4) {
    // First get the current product to understand its category
    const currentProduct = await ProductModel.findOne({
      _id: productId,
      isPublished: true,
      status: 'Published'
    });

    if (!currentProduct) {
      throw new NotFoundException('Product not found');
    }

    // Get recommendations based on category and exclude current product
    const recommendations = await ProductModel.find({
      _id: { $ne: productId },
      category: currentProduct.category,
      isPublished: true,
      status: 'Published'
    })
    .select('_id name category shortDescription images')
    .limit(limit)
    .sort({ createdAt: -1 });

    // If we don't have enough products in the same category, get from other categories
    if (recommendations.length < limit) {
      const remainingLimit = limit - recommendations.length;
      const additionalProducts = await ProductModel.find({
        _id: { $ne: productId },
        category: { $ne: currentProduct.category },
        isPublished: true,
        status: 'Published'
      })
      .select('_id name category shortDescription images')
      .limit(remainingLimit)
      .sort({ createdAt: -1 });

      recommendations.push(...additionalProducts);
    }

    return recommendations;
  }

  /**
   * Get product with recommendations
   */
  async getProductWithRecommendations(productId: string) {
    const [product, recommendations] = await Promise.all([
      this.getProductByIdSpecific(productId),
      this.getProductRecommendations(productId, 4)
    ]);

    return {
      product,
      recommendations
    };
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string) {
    return await ProductModel.find({
      category: category,
      isPublished: true,
      status: 'Published'
    }).select('name shortDescription images category createdAt');
  }

  /**
   * Get featured products (products that are marked as featured)
   */
  async getFeaturedProducts() {
    // For now, we'll return the most recent published products
    // In the future, you can add a 'featured' field to the product schema
    return await ProductModel.find({
      isPublished: true,
      status: 'Published'
    })
    .sort({ createdAt: -1 })
    .limit(4)
    .select('name shortDescription images category createdAt');
  }

  /**
   * Search products by name or description
   */
  async searchProducts(query: string) {
    return await ProductModel.find({
      $and: [
        {
          isPublished: true,
          status: 'Published'
        },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { shortDescription: { $regex: query, $options: 'i' } },
            { fullDescription: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name shortDescription images category createdAt');
  }

  /**
   * Get products with pagination
   */
  async getProductsWithPagination(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      ProductModel.find({
        isPublished: true,
        status: 'Published'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name shortDescription images category createdAt'),
      
      ProductModel.countDocuments({
        isPublished: true,
        status: 'Published'
      })
    ]);

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Get all categories
   */
  async getAllCategories() {
    const categories = await ProductModel.distinct('category', {
      isPublished: true,
      status: 'Published'
    });
    
    return categories.filter(category => category && category.trim() !== '');
  }
} 