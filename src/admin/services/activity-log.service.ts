import { Injectable } from '@nestjs/common';
import { ActivityLogModel } from '../models/activity-log.schema';

@Injectable()
export class ActivityLogService {

  /**
   * Log an activity
   */
  async logActivity(data: {
    action: string;
    entity: string;
    entityId?: string;
    entityName?: string;
    userId?: string;
    userEmail?: string;
    details?: string;
    type: 'create' | 'update' | 'delete' | 'status' | 'system' | 'edit';
  }) {
    const activity = new ActivityLogModel({
      ...data,
      timestamp: new Date()
    });

    await activity.save();
    return activity;
  }

  /**
   * Log product creation
   */
  async logProductCreated(productId: string, productName: string, userId?: string, userEmail?: string) {
    return this.logActivity({
      action: 'Product Created',
      entity: 'Product',
      entityId: productId,
      entityName: productName,
      userId,
      userEmail,
      type: 'create'
    });
  }

  /**
   * Log product update
   */
  async logProductUpdated(productId: string, productName: string, userId?: string, userEmail?: string) {
    return this.logActivity({
      action: 'Product Updated',
      entity: 'Product',
      entityId: productId,
      entityName: productName,
      userId,
      userEmail,
      type: 'update'
    });
  }

  /**
   * Log product deletion
   */
  async logProductDeleted(productId: string, productName: string, userId?: string, userEmail?: string) {
    return this.logActivity({
      action: 'Product Deleted',
      entity: 'Product',
      entityId: productId,
      entityName: productName,
      userId,
      userEmail,
      type: 'delete'
    });
  }

  /**
   * Log product status change
   */
  async logProductStatusChanged(productId: string, productName: string, newStatus: string, userId?: string, userEmail?: string) {
    return this.logActivity({
      action: 'Product Status Changed',
      entity: 'Product',
      entityId: productId,
      entityName: productName,
      details: `Status changed to ${newStatus}`,
      userId,
      userEmail,
      type: 'status'
    });
  }

  /**
   * Log FAQ creation
   */
  async logFAQCreated(faqId: string, question: string, userId?: string, userEmail?: string) {
    return this.logActivity({
      action: 'FAQ Created',
      entity: 'FAQ',
      entityId: faqId,
      entityName: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
      userId,
      userEmail,
      type: 'create'
    });
  }

  /**
   * Log FAQ update
   */
  async logFAQUpdated(faqId: string, question: string, userId?: string, userEmail?: string) {
    return this.logActivity({
      action: 'FAQ Updated',
      entity: 'FAQ',
      entityId: faqId,
      entityName: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
      userId,
      userEmail,
      type: 'update'
    });
  }

  /**
   * Log FAQ deletion
   */
  async logFAQDeleted(faqId: string, question: string, userId?: string, userEmail?: string) {
    return this.logActivity({
      action: 'FAQ Deleted',
      entity: 'FAQ',
      entityId: faqId,
      entityName: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
      userId,
      userEmail,
      type: 'delete'
    });
  }

  /**
   * Log page update
   */
  async logPageUpdated(pageName: string, userId?: string, userEmail?: string) {
    return this.logActivity({
      action: 'Page Updated',
      entity: 'Page',
      entityName: pageName,
      userId,
      userEmail,
      type: 'edit'
    });
  }

  /**
   * Log system activity
   */
  async logSystemActivity(action: string, details?: string) {
    return this.logActivity({
      action,
      entity: 'System',
      details,
      type: 'system'
    });
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit: number = 10) {
    return ActivityLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get activities by entity
   */
  async getActivitiesByEntity(entity: string, limit: number = 10) {
    return ActivityLogModel
      .find({ entity })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get activities by type
   */
  async getActivitiesByType(type: 'create' | 'update' | 'delete' | 'status' | 'system' | 'edit', limit: number = 10) {
    return ActivityLogModel
      .find({ type })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }
} 