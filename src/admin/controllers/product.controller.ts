import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  Query, 
  UseInterceptors,
  UploadedFile,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { CreateProductDto, UpdateProductDto, UpdateProductStatusDto } from '../enums/product.dto';
import { FileUploadInterceptor } from '../../common/interceptors/file-upload.interceptor';
import { AdminSuccessResponse } from '../enums/response';

@Controller('admin/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * GET /admin/products - Get All Products
   */
  @Get()
  async getAllProducts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string
  ) {
    const result = await this.productService.getAllProducts(
      parseInt(page),
      parseInt(limit),
      search
    );
    return new AdminSuccessResponse('Products fetched successfully', result);
  }

  /**
   * GET /admin/products/:id - Get Single Product
   */
  @Get(':id')
  async getProductById(@Param('id') id: string) {
    const product = await this.productService.getProductById(id);
    return new AdminSuccessResponse('Product fetched successfully', product);
  }

  /**
   * POST /admin/products - Create New Product
   */
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createProduct(@Body() dto: CreateProductDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const product = await this.productService.createProduct(dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('Product created successfully', product);
  }

  /**
   * PUT /admin/products/:id - Update Product
   */
  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const product = await this.productService.updateProduct(id, dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('Product updated successfully', product);
  }

  /**
   * DELETE /admin/products/:id - Delete Product
   */
  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    // TODO: Get user info from JWT token when auth is implemented
    const result = await this.productService.deleteProduct(id, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('Product deleted successfully', result);
  }

  /**
   * POST /admin/products/:id/upload-image - Upload Product Image
   */
  @Post(':id/upload-image')
  @UseInterceptors(FileUploadInterceptor)
  async uploadProductImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    try {
      const imageUrl = await this.productService.uploadProductImage(file);
      const result = await this.productService.addProductImage(id, imageUrl);
      return new AdminSuccessResponse('Product image uploaded successfully', result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * PATCH /admin/products/:id/status - Update Product Status
   */
  @Patch(':id/status')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateProductStatus(@Param('id') id: string, @Body() dto: UpdateProductStatusDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const result = await this.productService.updateProductStatus(id, dto, 'admin', 'admin@example.com');
    return new AdminSuccessResponse('Product status updated successfully', result);
  }

  /**
   * DELETE /admin/products/:id/images - Remove specific image from product
   */
  @Delete(':id/images')
  async removeProductImage(@Param('id') id: string, @Body() body: { imageUrl: string }) {
    const result = await this.productService.removeProductImage(id, body.imageUrl);
    return new AdminSuccessResponse('Product image removed successfully', result);
  }
} 