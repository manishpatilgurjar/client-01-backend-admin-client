import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AdminUserModel } from '../models/user.schema';
import { 
  CreateAdminDto, 
  UpdateAdminDto, 
  ChangeAdminPasswordDto, 
  AdminQueryDto, 
  AdminResponseDto,
  AdminRole,
  AdminStatus
} from '../enums/admin-management.dto';
import { ActivityLogService } from './activity-log.service';
import { MailService } from '../../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminManagementService {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly mailService: MailService
  ) {}

  /**
   * Get all admins with pagination and filtering
   */
  async getAllAdmins(query: AdminQueryDto, currentUserId: string): Promise<{
    success: boolean;
    message: string;
    data: AdminResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    // Check if current user is super admin
    const currentUser = await AdminUserModel.findById(currentUserId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can manage other admins');
    }

    const page = parseInt(query.page || '1') || 1;
    const limit = parseInt(query.limit || '10') || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    
    if (query.search) {
      filter.$or = [
        { username: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } }
      ];
    }

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.isActive = query.status === AdminStatus.ACTIVE;
    }

    // Get total count
    const total = await AdminUserModel.countDocuments(filter);

    // Build sort
    const sort: any = {};
    if (query.sortBy) {
      sort[query.sortBy] = query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by creation date
    }

    // Get admins
    const admins = await AdminUserModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      message: 'Admins retrieved successfully',
      data: admins.map(admin => ({
        id: (admin._id as any).toString(),
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        role: admin.role as AdminRole,
        phone: admin.phone,
        location: admin.location,
        bio: admin.bio,
        profilePic: admin.profilePic,
        isActive: admin.isActive,
        twoFactorEnabled: admin.twoFactorEnabled,
        permissions: admin.permissions || [],
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };
  }

  /**
   * Get admin by ID
   */
  async getAdminById(adminId: string, currentUserId: string): Promise<{
    success: boolean;
    message: string;
    data: AdminResponseDto;
  }> {
    // Check if current user is super admin
    const currentUser = await AdminUserModel.findById(currentUserId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can view admin details');
    }

    const admin = await AdminUserModel.findById(adminId).lean();
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return {
      success: true,
      message: 'Admin retrieved successfully',
      data: {
        id: (admin._id as any).toString(),
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        role: admin.role,
        phone: admin.phone,
        location: admin.location,
        bio: admin.bio,
        profilePic: admin.profilePic,
        isActive: admin.isActive,
        twoFactorEnabled: admin.twoFactorEnabled,
        permissions: admin.permissions || [],
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    };
  }

  /**
   * Create new admin
   */
  async createAdmin(dto: CreateAdminDto, currentUserId: string): Promise<{
    success: boolean;
    message: string;
    data: AdminResponseDto;
  }> {
    // Check if current user is super admin
    const currentUser = await AdminUserModel.findById(currentUserId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can create new admins');
    }

    // Check if email already exists
    const existingAdmin = await AdminUserModel.findOne({ email: dto.email });
    if (existingAdmin) {
      throw new BadRequestException('Email already exists');
    }

    // Check if username already exists
    const existingUsername = await AdminUserModel.findOne({ username: dto.username });
    if (existingUsername) {
      throw new BadRequestException('Username already exists');
    }

    // Create admin
    const admin = await AdminUserModel.create({
      username: dto.username,
      email: dto.email,
      password: dto.password, // Will be hashed by pre-save hook
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      phone: dto.phone,
      location: dto.location,
      bio: dto.bio,
      permissions: dto.permissions || ['read', 'write'],
      isActive: dto.isActive !== undefined ? dto.isActive : true
    });

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Admin Created',
      entity: 'AdminUser',
      entityId: (admin._id as any).toString(),
      entityName: `${admin.firstName} ${admin.lastName}`,
      userId: currentUserId,
      userEmail: currentUser.email,
      userRole: currentUser.role, // Add user role
      type: 'create',
      details: `Created ${dto.role} with email: ${dto.email}`
    });

    // Send welcome email with credentials
    this.mailService.sendAdminWelcomeEmail({
      email: admin.email,
      username: admin.username,
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      password: dto.password, // Send the original password (before hashing)
      role: admin.role
    });

    return {
      success: true,
      message: 'Admin created successfully',
      data: {
        id: (admin._id as any).toString(),
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        role: admin.role,
        phone: admin.phone,
        location: admin.location,
        bio: admin.bio,
        profilePic: admin.profilePic,
        isActive: admin.isActive,
        twoFactorEnabled: admin.twoFactorEnabled,
        permissions: admin.permissions || [],
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    };
  }

  /**
   * Update admin
   */
  async updateAdmin(adminId: string, dto: UpdateAdminDto, currentUserId: string): Promise<{
    success: boolean;
    message: string;
    data: AdminResponseDto;
  }> {
    // Check if current user is super admin
    const currentUser = await AdminUserModel.findById(currentUserId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can update other admins');
    }

    const admin = await AdminUserModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent super admin from changing their own role
    if (adminId === currentUserId && dto.role && dto.role !== 'super_admin') {
      throw new BadRequestException('Cannot change your own role');
    }

    // Check if email is being changed and if it's already taken
    if (dto.email && dto.email !== admin.email) {
      const existingAdmin = await AdminUserModel.findOne({ email: dto.email });
      if (existingAdmin) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Check if username is being changed and if it's already taken
    if (dto.username && dto.username !== admin.username) {
      const existingUsername = await AdminUserModel.findOne({ username: dto.username });
      if (existingUsername) {
        throw new BadRequestException('Username already exists');
      }
    }

    // Update fields
    if (dto.username !== undefined) admin.username = dto.username;
    if (dto.email !== undefined) admin.email = dto.email;
    if (dto.firstName !== undefined) admin.firstName = dto.firstName;
    if (dto.lastName !== undefined) admin.lastName = dto.lastName;
    if (dto.role !== undefined) admin.role = dto.role;
    if (dto.phone !== undefined) admin.phone = dto.phone;
    if (dto.location !== undefined) admin.location = dto.location;
    if (dto.bio !== undefined) admin.bio = dto.bio;
    if (dto.permissions !== undefined) admin.permissions = dto.permissions;
    if (dto.isActive !== undefined) admin.isActive = dto.isActive;

    await admin.save();

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Admin Updated',
      entity: 'AdminUser',
      entityId: (admin._id as any).toString(),
      entityName: `${admin.firstName} ${admin.lastName}`,
      userId: currentUserId,
      userEmail: currentUser.email,
      userRole: currentUser.role, // Add user role
      type: 'update',
      details: `Updated admin: ${admin.email}`
    });

    return {
      success: true,
      message: 'Admin updated successfully',
      data: {
        id: (admin._id as any).toString(),
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        role: admin.role,
        phone: admin.phone,
        location: admin.location,
        bio: admin.bio,
        profilePic: admin.profilePic,
        isActive: admin.isActive,
        twoFactorEnabled: admin.twoFactorEnabled,
        permissions: admin.permissions || [],
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    };
  }

  /**
   * Change admin password
   */
  async changeAdminPassword(adminId: string, dto: ChangeAdminPasswordDto, currentUserId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    // Check if current user is super admin
    const currentUser = await AdminUserModel.findById(currentUserId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can change admin passwords');
    }

    const admin = await AdminUserModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Verify password confirmation
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirmation do not match');
    }

    // Update password
    admin.password = dto.newPassword; // Will be hashed by pre-save hook
    await admin.save();

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Admin Password Changed',
      entity: 'AdminUser',
      entityId: (admin._id as any).toString(),
      entityName: `${admin.firstName} ${admin.lastName}`,
      userId: currentUserId,
      userEmail: currentUser.email,
      userRole: currentUser.role, // Add user role
      type: 'update',
      details: `Password changed for admin: ${admin.email}`
    });

    // Send password change notification
    this.mailService.sendPasswordChangeConfirmation(
      admin.email,
      new Date(),
      undefined,
      undefined,
      0
    );

    return {
      success: true,
      message: 'Admin password changed successfully'
    };
  }

  /**
   * Delete admin (soft delete by setting isActive to false)
   */
  async deleteAdmin(adminId: string, currentUserId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    // Check if current user is super admin
    const currentUser = await AdminUserModel.findById(currentUserId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can delete other admins');
    }

    const admin = await AdminUserModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent super admin from deleting themselves
    if (adminId === currentUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Soft delete by setting isActive to false
    admin.isActive = false;
    await admin.save();

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Admin Deleted',
      entity: 'AdminUser',
      entityId: (admin._id as any).toString(),
      entityName: `${admin.firstName} ${admin.lastName}`,
      userId: currentUserId,
      userEmail: currentUser.email,
      userRole: currentUser.role, // Add user role
      type: 'delete',
      details: `Deleted admin: ${admin.email}`
    });

    return {
      success: true,
      message: 'Admin deleted successfully'
    };
  }

  /**
   * Get admin statistics
   */
  async getAdminStats(currentUserId: string): Promise<{
    success: boolean;
    message: string;
    data: {
      total: number;
      superAdmins: number;
      admins: number;
      active: number;
      inactive: number;
      online: number;
    };
  }> {
    // Check if current user is super admin
    const currentUser = await AdminUserModel.findById(currentUserId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can view admin statistics');
    }

    const total = await AdminUserModel.countDocuments();
    const superAdmins = await AdminUserModel.countDocuments({ role: 'super_admin' });
    const admins = await AdminUserModel.countDocuments({ role: 'admin' });
    const active = await AdminUserModel.countDocuments({ isActive: true });
    const inactive = await AdminUserModel.countDocuments({ isActive: false });
    
    // Consider users online if they logged in within the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const online = await AdminUserModel.countDocuments({
      lastLogin: { $gte: thirtyMinutesAgo }
    });

    return {
      success: true,
      message: 'Admin statistics retrieved successfully',
      data: {
        total,
        superAdmins,
        admins,
        active,
        inactive,
        online
      }
    };
  }

  /**
   * Toggle admin status (activate/deactivate)
   */
  async toggleAdminStatus(adminId: string, currentUserId: string): Promise<{
    success: boolean;
    message: string;
    data: AdminResponseDto;
  }> {
    // Check if current user is super admin
    const currentUser = await AdminUserModel.findById(currentUserId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      throw new UnauthorizedException('Only super admins can toggle admin status');
    }

    const admin = await AdminUserModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent super admin from deactivating themselves
    if (adminId === currentUserId) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    // Toggle status
    admin.isActive = !admin.isActive;
    await admin.save();

    const action = admin.isActive ? 'activated' : 'deactivated';

    // Log activity
    await this.activityLogService.logActivity({
      action: `Admin ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      entity: 'AdminUser',
      entityId: (admin._id as any).toString(),
      entityName: `${admin.firstName} ${admin.lastName}`,
      userId: currentUserId,
      userEmail: currentUser.email,
      userRole: currentUser.role, // Add user role
      type: 'update',
      details: `${action} admin: ${admin.email}`
    });

    return {
      success: true,
      message: `Admin ${action} successfully`,
      data: {
        id: (admin._id as any).toString(),
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        role: admin.role,
        phone: admin.phone,
        location: admin.location,
        bio: admin.bio,
        profilePic: admin.profilePic,
        isActive: admin.isActive,
        twoFactorEnabled: admin.twoFactorEnabled,
        permissions: admin.permissions || [],
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    };
  }
} 