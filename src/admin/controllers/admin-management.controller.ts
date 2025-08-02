import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Req
} from '@nestjs/common';
import { AdminManagementService } from '../services/admin-management.service';
import { 
  CreateAdminDto, 
  UpdateAdminDto, 
  ChangeAdminPasswordDto, 
  AdminQueryDto 
} from '../enums/admin-management.dto';
import { AdminAuthMiddleware } from '../middleware/auth.middleware';

@Controller('admin/admin-management')
@UseGuards(AdminAuthMiddleware)
export class AdminManagementController {
  constructor(private readonly adminManagementService: AdminManagementService) {}

  /**
   * Get all admins with pagination and filtering
   */
  @Get()
  async getAllAdmins(
    @Query() query: AdminQueryDto,
    @Req() req: any
  ) {
    return this.adminManagementService.getAllAdmins(query, req.user.id);
  }

  /**
   * Get admin statistics
   */
  @Get('stats')
  async getAdminStats(@Req() req: any) {
    return this.adminManagementService.getAdminStats(req.user.id);
  }

  /**
   * Get admin by ID
   */
  @Get(':id')
  async getAdminById(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.adminManagementService.getAdminById(id, req.user.id);
  }

  /**
   * Create new admin
   */
  @Post()
  async createAdmin(
    @Body() dto: CreateAdminDto,
    @Req() req: any
  ) {
    return this.adminManagementService.createAdmin(dto, req.user.id);
  }

  /**
   * Update admin
   */
  @Put(':id')
  async updateAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateAdminDto,
    @Req() req: any
  ) {
    return this.adminManagementService.updateAdmin(id, dto, req.user.id);
  }

  /**
   * Change admin password
   */
  @Put(':id/password')
  async changeAdminPassword(
    @Param('id') id: string,
    @Body() dto: ChangeAdminPasswordDto,
    @Req() req: any
  ) {
    return this.adminManagementService.changeAdminPassword(id, dto, req.user.id);
  }

  /**
   * Toggle admin status (activate/deactivate)
   */
  @Put(':id/toggle-status')
  async toggleAdminStatus(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.adminManagementService.toggleAdminStatus(id, req.user.id);
  }

  /**
   * Delete admin (soft delete)
   */
  @Delete(':id')
  async deleteAdmin(
    @Param('id') id: string,
    @Req() req: any
  ) {
    return this.adminManagementService.deleteAdmin(id, req.user.id);
  }
} 