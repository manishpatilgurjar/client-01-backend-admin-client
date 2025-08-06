import { 
  Controller, 
  Get, 
  Param, 
  Query 
} from '@nestjs/common';
import { ClientProductService } from '../services/product.service';
import { AdminSuccessResponse } from '../../admin/enums/response';

@Controller('api/client/products')
export class ClientProductController {
  constructor(private readonly productService: ClientProductService) {}

  /**
   * GET /api/client/products
   * Get all published products with optional pagination
   */
  @Get()
  async getAllProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    if (pageNum < 1 || limitNum < 1) {
      return new AdminSuccessResponse('Invalid pagination parameters', []);
    }

    const result = await this.productService.getProductsWithPagination(pageNum, limitNum);
    return new AdminSuccessResponse('Products fetched successfully', result);
  }

  /**
   * GET /api/client/products/all
   * Get all products in one shot (complete details)
   */
  @Get('all')
  async getAllProductsComplete() {
    const products = await this.productService.getAllProductsSpecific();
    return new AdminSuccessResponse('All products fetched successfully', products);
  }

  /**
   * GET /api/products/:id
   * Get product by ID
   */
  @Get(':id')
  async getProductById(@Param('id') id: string) {
    const product = await this.productService.getProductById(id);
    return new AdminSuccessResponse('Product fetched successfully', product);
  }

  /**
   * GET /api/products/category/:category
   * Get products by category
   */
  @Get('category/:category')
  async getProductsByCategory(@Param('category') category: string) {
    const products = await this.productService.getProductsByCategory(category);
    return new AdminSuccessResponse('Products fetched successfully', products);
  }

  /**
   * GET /api/products/featured
   * Get featured products
   */
  @Get('featured')
  async getFeaturedProducts() {
    const products = await this.productService.getFeaturedProducts();
    return new AdminSuccessResponse('Featured products fetched successfully', products);
  }

  /**
   * GET /api/products/search
   * Search products by query
   */
  @Get('search')
  async searchProducts(@Query('q') query: string) {
    if (!query || query.trim() === '') {
      return new AdminSuccessResponse('Search query is required', []);
    }

    const products = await this.productService.searchProducts(query.trim());
    return new AdminSuccessResponse('Search results fetched successfully', products);
  }

  /**
   * GET /api/products/categories
   * Get all product categories
   */
  @Get('categories')
  async getAllCategories() {
    const categories = await this.productService.getAllCategories();
    return new AdminSuccessResponse('Categories fetched successfully', categories);
  }

  /**
   * GET /api/client/products/:id/with-recommendations
   * Get product by ID with 4 recommendations
   */
  @Get(':id/with-recommendations')
  async getProductWithRecommendations(@Param('id') id: string) {
    const result = await this.productService.getProductWithRecommendations(id);
    return new AdminSuccessResponse('Product with recommendations fetched successfully', result);
  }

  /**
   * GET /api/client/products/:id/recommendations
   * Get product recommendations only
   */
  @Get(':id/recommendations')
  async getProductRecommendations(@Param('id') id: string) {
    const recommendations = await this.productService.getProductRecommendations(id);
    return new AdminSuccessResponse('Product recommendations fetched successfully', recommendations);
  }
} 