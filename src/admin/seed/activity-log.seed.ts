import { ActivityLogService } from '../services/activity-log.service';

export async function seedActivityLog(activityLogService: ActivityLogService) {
  try {
    console.log('🌱 Seeding Activity Log...');

    // Log some initial system activities
    await activityLogService.logSystemActivity('System Initialized', 'Admin panel started successfully');
    
    // Log some sample product activities (these will be replaced by real activities)
    await activityLogService.logProductCreated(
      '507f1f77bcf86cd799439011',
      'Sample Product 1',
      'admin',
      'admin@example.com'
    );

    await activityLogService.logProductUpdated(
      '507f1f77bcf86cd799439012',
      'Sample Product 2',
      'admin',
      'admin@example.com'
    );

    await activityLogService.logProductStatusChanged(
      '507f1f77bcf86cd799439013',
      'Sample Product 3',
      'Published',
      'admin',
      'admin@example.com'
    );

    // Log some page activities
    await activityLogService.logPageUpdated('Index Page', 'admin', 'admin@example.com');
    await activityLogService.logPageUpdated('About Us', 'admin', 'admin@example.com');

    console.log('✅ Activity Log seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding Activity Log:', error);
  }
} 