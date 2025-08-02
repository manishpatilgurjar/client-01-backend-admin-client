import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EnquiryModel } from '../models/enquiry.schema';
import { AdminUserModel } from '../models/user.schema';
import { ContactFormDto, UpdateEnquiryDto, EnquiryQueryDto, EnquiryResponseDto, EnquiryListResponseDto } from '../enums/enquiry.dto';
import { AdminMessages } from '../enums/messages';
import { ActivityLogService } from './activity-log.service';
import { MailService } from '../../mail/mail.service';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class EnquiryService {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly mailService: MailService,
    private readonly encryptionService: EncryptionService
  ) {}

  /**
   * Submit contact form (public API)
   */
  async submitContactForm(dto: ContactFormDto, ipAddress?: string, userAgent?: string): Promise<{ message: string; enquiryId: string }> {
    // Create new enquiry
    const enquiry = await EnquiryModel.create({
      ...dto,
      ipAddress,
      userAgent,
      status: 'new',
      isStarred: false
    });

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Contact Form Submitted',
      entity: 'Enquiry',
      entityName: `${dto.fullName} - ${dto.subject}`,
      details: `New enquiry from ${dto.email}`,
      type: 'create'
    });

    // Send notification email to all admins and super admins (non-blocking)
    this.sendEnquiryNotificationToAdmins(enquiry);

    return {
      message: AdminMessages.CONTACT_FORM_SUBMITTED_SUCCESS,
      enquiryId: (enquiry as any)._id.toString()
    };
  }

  /**
   * Send enquiry notification to all admins and super admins
   */
  private async sendEnquiryNotificationToAdmins(enquiry: any) {
    try {
      // Get all admin and super admin emails
      const admins = await AdminUserModel.find({
        role: { $in: ['admin', 'super_admin'] },
        isActive: true
      }).select('email').lean();

      if (admins.length > 0) {
        const adminEmails = admins.map(admin => admin.email);
        
        // Send notification email (non-blocking)
        this.mailService.sendEnquiryNotificationToAdmins({
          fullName: enquiry.fullName,
          email: enquiry.email,
          phone: enquiry.phone,
          subject: enquiry.subject,
          inquiryCategory: enquiry.inquiryCategory,
          message: enquiry.message,
          isStarred: enquiry.isStarred,
          ipAddress: enquiry.ipAddress,
          createdAt: enquiry.createdAt
        }, adminEmails);
      }
    } catch (error) {
      console.error('Failed to send enquiry notification to admins:', error);
    }
  }

  /**
   * Get all enquiries with comprehensive filtering and pagination (admin API)
   */
  async getAllEnquiries(query: EnquiryQueryDto): Promise<EnquiryListResponseDto> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    // Build comprehensive filter conditions
    const filter: any = {};

    // Global search across multiple fields
    if (query.search) {
      filter.$or = [
        { fullName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { subject: { $regex: query.search, $options: 'i' } },
        { message: { $regex: query.search, $options: 'i' } },
        { adminNotes: { $regex: query.search, $options: 'i' } },
        { inquiryCategory: { $regex: query.search, $options: 'i' } }
      ];
    }

    // Status filter
    if (query.status) {
      filter.status = query.status;
    }

    // Category filter
    if (query.category) {
      filter.inquiryCategory = query.category;
    }

    // Starred filter
    if (query.starred !== undefined) {
      filter.isStarred = query.starred;
    }

    // Email filter
    if (query.email) {
      filter.email = { $regex: query.email, $options: 'i' };
    }

    // Phone filter
    if (query.phone) {
      filter.phone = { $regex: query.phone, $options: 'i' };
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        // Set end date to end of day
        const endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    // Has replies filter
    if (query.hasReplies !== undefined) {
      if (query.hasReplies) {
        filter.replies = { $exists: true, $ne: [] };
      } else {
        filter.$or = [
          { replies: { $exists: false } },
          { replies: { $size: 0 } }
        ];
      }
    }

    // Has admin notes filter
    if (query.hasAdminNotes !== undefined) {
      if (query.hasAdminNotes) {
        filter.adminNotes = { 
          $exists: true, 
          $nin: [null, '']
        };
      } else {
        filter.$or = [
          { adminNotes: { $exists: false } },
          { adminNotes: null },
          { adminNotes: '' }
        ];
      }
    }

    // Build sort object
    const sort: any = {};
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    
    // Validate sort fields
    const allowedSortFields = [
      'createdAt', 'updatedAt', 'fullName', 'email', 'subject', 
      'status', 'inquiryCategory', 'isStarred', 'repliedAt'
    ];
    
    if (allowedSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      // Default sorting
      sort.createdAt = -1;
    }

    // Get total count
    const total = await EnquiryModel.countDocuments(filter);

    // Get enquiries with pagination and sorting
    const enquiries = await EnquiryModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform to response format with additional computed fields
    const enquiryResponses: EnquiryResponseDto[] = enquiries.map(enquiry => ({
      id: enquiry._id.toString(),
      fullName: enquiry.fullName,
      email: enquiry.email,
      phone: enquiry.phone,
      subject: enquiry.subject,
      inquiryCategory: enquiry.inquiryCategory,
      message: enquiry.message,
      status: enquiry.status,
      isStarred: enquiry.isStarred,
      ipAddress: enquiry.ipAddress,
      userAgent: enquiry.userAgent,
      adminNotes: enquiry.adminNotes,
      repliedAt: enquiry.repliedAt,
      replies: enquiry.replies || [],
      createdAt: enquiry.createdAt,
      updatedAt: enquiry.updatedAt
    }));

    return {
      enquiries: enquiryResponses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };
  }

  /**
   * Get single enquiry by ID (admin API)
   */
  async getEnquiryById(id: string): Promise<EnquiryResponseDto> {
    const enquiry = await EnquiryModel.findById(id).lean();
    
    if (!enquiry) {
      throw new NotFoundException(AdminMessages.ENQUIRY_NOT_FOUND);
    }

    return {
      id: enquiry._id.toString(),
      fullName: enquiry.fullName,
      email: enquiry.email,
      phone: enquiry.phone,
      subject: enquiry.subject,
      inquiryCategory: enquiry.inquiryCategory,
      message: enquiry.message,
      status: enquiry.status,
      isStarred: enquiry.isStarred,
      ipAddress: enquiry.ipAddress,
      userAgent: enquiry.userAgent,
      adminNotes: enquiry.adminNotes,
      repliedAt: enquiry.repliedAt,
      replies: enquiry.replies || [],
      createdAt: enquiry.createdAt,
      updatedAt: enquiry.updatedAt
    };
  }

  /**
   * Update enquiry (admin API)
   */
  async updateEnquiry(id: string, dto: UpdateEnquiryDto): Promise<{ message: string }> {
    const enquiry = await EnquiryModel.findById(id);
    
    if (!enquiry) {
      throw new NotFoundException(AdminMessages.ENQUIRY_NOT_FOUND);
    }

    // Track changes for activity log
    const changes: string[] = [];
    
    if (dto.status && dto.status !== enquiry.status) {
      changes.push(`Status: ${enquiry.status} → ${dto.status}`);
      enquiry.status = dto.status as 'new' | 'in-progress' | 'replied' | 'closed';
      
      // Set repliedAt if status is changed to 'replied'
      if (dto.status === 'replied' && !enquiry.repliedAt) {
        enquiry.repliedAt = new Date();
      }
    }

    if (dto.isStarred !== undefined && dto.isStarred !== enquiry.isStarred) {
      changes.push(`Starred: ${enquiry.isStarred} → ${dto.isStarred}`);
      enquiry.isStarred = dto.isStarred;
    }

    if (dto.adminNotes !== undefined && dto.adminNotes !== enquiry.adminNotes) {
      changes.push('Admin notes updated');
      enquiry.adminNotes = dto.adminNotes;
    }

    await enquiry.save();

    // Log activity if there were changes
    if (changes.length > 0) {
      await this.activityLogService.logActivity({
        action: 'Updated Enquiry',
        entity: 'Enquiry',
        entityName: `${enquiry.fullName} - ${enquiry.subject}`,
        details: changes.join(', '),
        type: 'edit'
      });
    }

    return { message: AdminMessages.ENQUIRY_UPDATED_SUCCESS };
  }

  /**
   * Delete enquiry (admin API)
   */
  async deleteEnquiry(id: string): Promise<{ message: string }> {
    const enquiry = await EnquiryModel.findById(id);
    
    if (!enquiry) {
      throw new NotFoundException(AdminMessages.ENQUIRY_NOT_FOUND);
    }

    await EnquiryModel.findByIdAndDelete(id);

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Deleted Enquiry',
      entity: 'Enquiry',
      entityName: `${enquiry.fullName} - ${enquiry.subject}`,
      details: `Enquiry from ${enquiry.email} deleted`,
      type: 'delete'
    });

    return { message: AdminMessages.ENQUIRY_DELETED_SUCCESS };
  }

  /**
   * Send admin reply to enquiry submitter
   */
  async sendAdminReply(enquiryId: string, adminReply: string, adminName: string, adminEmail: string): Promise<{ message: string }> {
    const enquiry = await EnquiryModel.findById(enquiryId);
    
    if (!enquiry) {
      throw new NotFoundException(AdminMessages.ENQUIRY_NOT_FOUND);
    }

    // Create reply object
    const reply = {
      adminName,
      adminEmail,
      replyMessage: adminReply,
      repliedAt: new Date()
    };

    // Add reply to enquiry
    if (!enquiry.replies) {
      enquiry.replies = [];
    }
    enquiry.replies.push(reply);

    // Send reply email to the enquirer (non-blocking)
    this.mailService.sendAdminReplyToEnquirer({
      fullName: enquiry.fullName,
      email: enquiry.email,
      subject: enquiry.subject,
      message: enquiry.message
    }, adminReply, adminName);

    // Update enquiry status to 'replied' and set repliedAt
    enquiry.status = 'replied';
    enquiry.repliedAt = new Date();
    await enquiry.save();

    // Log activity
    await this.activityLogService.logActivity({
      action: 'Replied to Enquiry',
      entity: 'Enquiry',
      entityName: `${enquiry.fullName} - ${enquiry.subject}`,
      details: `Reply sent to ${enquiry.email}`,
      type: 'edit'
    });

    return { message: 'Reply sent successfully to the enquirer' };
  }

  /**
   * Get enquiry statistics (admin API)
   */
  async getEnquiryStats(): Promise<{
    total: number;
    new: number;
    inProgress: number;
    replied: number;
    closed: number;
    starred: number;
  }> {
    const [total, newCount, inProgress, replied, closed, starred] = await Promise.all([
      EnquiryModel.countDocuments(),
      EnquiryModel.countDocuments({ status: 'new' }),
      EnquiryModel.countDocuments({ status: 'in-progress' }),
      EnquiryModel.countDocuments({ status: 'replied' }),
      EnquiryModel.countDocuments({ status: 'closed' }),
      EnquiryModel.countDocuments({ isStarred: true })
    ]);

    return {
      total,
      new: newCount,
      inProgress,
      replied,
      closed,
      starred
    };
  }

  /**
   * Get available filter options for frontend (admin API)
   */
  async getFilterOptions(): Promise<{
    categories: { value: string; count: number }[];
    statuses: { value: string; count: number }[];
    dateRanges: {
      today: number;
      yesterday: number;
      last7Days: number;
      last30Days: number;
      thisMonth: number;
      lastMonth: number;
    };
  }> {
    // Get category counts
    const categoryStats = await EnquiryModel.aggregate([
      {
        $group: {
          _id: '$inquiryCategory',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          value: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get status counts
    const statusStats = await EnquiryModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          value: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get date range counts
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [todayCount, yesterdayCount, last7DaysCount, last30DaysCount, thisMonthCount, lastMonthCount] = await Promise.all([
      EnquiryModel.countDocuments({ createdAt: { $gte: today } }),
      EnquiryModel.countDocuments({ 
        createdAt: { 
          $gte: yesterday, 
          $lt: today 
        } 
      }),
      EnquiryModel.countDocuments({ createdAt: { $gte: last7Days } }),
      EnquiryModel.countDocuments({ createdAt: { $gte: last30Days } }),
      EnquiryModel.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      EnquiryModel.countDocuments({ 
        createdAt: { 
          $gte: lastMonthStart, 
          $lte: lastMonthEnd 
        } 
      })
    ]);

    return {
      categories: categoryStats,
      statuses: statusStats,
      dateRanges: {
        today: todayCount,
        yesterday: yesterdayCount,
        last7Days: last7DaysCount,
        last30Days: last30DaysCount,
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount
      }
    };
  }

  /**
   * Export enquiries for CSV generation (admin API) - Encrypted
   */
  async exportEnquiries(dto: any): Promise<{
    enquiries: {
      fullName: string;
      email: string;
      phone: string;
      message: string;
      contactDate: string;
    }[];
    totalCount: number;
    exportDate: string;
    filters: any;
  }> {
    // Build filter conditions
    const filter: any = {};

    // Date filter logic
    if (dto.dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dto.dateFilter) {
        case 'today':
          filter.createdAt = { $gte: today };
          break;
        case 'yesterday':
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          filter.createdAt = { 
            $gte: yesterday, 
            $lt: today 
          };
          break;
        case 'last7days':
          const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filter.createdAt = { $gte: last7Days };
          break;
        case 'last30days':
          const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filter.createdAt = { $gte: last30Days };
          break;
        case 'thisMonth':
          const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          filter.createdAt = { $gte: thisMonthStart };
          break;
        case 'lastMonth':
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          filter.createdAt = { 
            $gte: lastMonthStart, 
            $lte: lastMonthEnd 
          };
          break;
        case 'thisYear':
          const thisYearStart = new Date(now.getFullYear(), 0, 1);
          filter.createdAt = { $gte: thisYearStart };
          break;
        case 'custom':
          if (dto.startDate || dto.endDate) {
            filter.createdAt = {};
            if (dto.startDate) {
              filter.createdAt.$gte = new Date(dto.startDate);
            }
            if (dto.endDate) {
              const endDate = new Date(dto.endDate);
              endDate.setHours(23, 59, 59, 999);
              filter.createdAt.$lte = endDate;
            }
          }
          break;
      }
    }

    // Status filter
    if (dto.status) {
      filter.status = dto.status;
    }

    // Category filter
    if (dto.category) {
      filter.inquiryCategory = dto.category;
    }

    // Starred filter
    if (dto.starred !== undefined) {
      filter.isStarred = dto.starred;
    }

    // Search filter
    if (dto.search) {
      filter.$or = [
        { fullName: { $regex: dto.search, $options: 'i' } },
        { email: { $regex: dto.search, $options: 'i' } },
        { phone: { $regex: dto.search, $options: 'i' } },
        { subject: { $regex: dto.search, $options: 'i' } },
        { message: { $regex: dto.search, $options: 'i' } }
      ];
    }

    // Get all enquiries matching the filter (no pagination for export)
    const enquiries = await EnquiryModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Transform to export format and encrypt each record individually
    const encryptedEnquiries = enquiries.map(enquiry => {
      const enquiryData = {
        fullName: enquiry.fullName || '',
        email: enquiry.email || '',
        phone: enquiry.phone || '',
        message: enquiry.message || '',
        contactDate: enquiry.createdAt ? enquiry.createdAt.toISOString().split('T')[0] : ''
      };
      
      // Encrypt each enquiry record individually
      const encrypted = this.encryptionService.encryptData(enquiryData);
      
      return {
        fullName: encrypted.encryptedData,
        email: encrypted.encryptionKey,
        phone: encrypted.iv,
        message: encrypted.tag,
        contactDate: enquiry.createdAt ? enquiry.createdAt.toISOString().split('T')[0] : ''
      };
    });

    // Log export activity
    await this.activityLogService.logActivity({
      action: 'Exported Enquiries',
      entity: 'Enquiry',
      entityName: `Export - ${encryptedEnquiries.length} enquiries`,
      details: `Exported ${encryptedEnquiries.length} enquiries with filters: ${JSON.stringify(dto)}`,
      type: 'system'
    });

    return {
      enquiries: encryptedEnquiries,
      totalCount: encryptedEnquiries.length,
      exportDate: new Date().toISOString(),
      filters: dto
    };
  }
} 