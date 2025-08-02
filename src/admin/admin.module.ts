import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { MailService } from '../mail/mail.service';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { AdminAuthMiddleware } from './middleware/auth.middleware';
import { AboutUsController } from './controllers/about-us.controller';
import { AboutUsService } from './services/about-us.service';
import { PrivacyPolicyController } from './controllers/privacy-policy.controller';
import { PrivacyPolicyService } from './services/privacy-policy.service';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { FAQController } from './controllers/faq.controller';
import { FAQService } from './services/faq.service';
import { IndexPageController } from './controllers/index-page.controller';
import { IndexPageService } from './services/index-page.service';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { ActivityLogService } from './services/activity-log.service';
import { S3UploadService } from '../common/services/s3-upload.service';
import { EncryptionService } from '../common/services/encryption.service';
import { ContactController } from './controllers/contact.controller';
import { EnquiryController } from './controllers/enquiry.controller';
import { EnquiryService } from './services/enquiry.service';
import { SiteSettingsController } from './controllers/site-settings.controller';
import { SiteSettingsService } from './services/site-settings.service';
import { AdminManagementController } from './controllers/admin-management.controller';
import { AdminManagementService } from './services/admin-management.service';

/**
 * AdminModule bundles all admin-related controllers and services.
 * Import this module in AppModule to enable admin APIs.
 */
@Module({
  controllers: [
    AuthController, 
    ProfileController, 
    AboutUsController, 
    PrivacyPolicyController, 
    ProductController, 
    FAQController, 
    IndexPageController, 
    DashboardController,
    ContactController,
    EnquiryController,
    SiteSettingsController,
    AdminManagementController
  ],
  providers: [
    AuthService, 
    ProfileService, 
    MailService, 
    AboutUsService, 
    PrivacyPolicyService, 
    ProductService, 
    FAQService, 
    IndexPageService, 
    DashboardService, 
    ActivityLogService, 
    S3UploadService,
    EnquiryService,
    EncryptionService,
    SiteSettingsService,
    AdminManagementService
  ],
  exports: [AuthService],
})
export class AdminModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminAuthMiddleware).forRoutes(
      'admin/profile', 
      'admin/users/profile', 
      'admin/about-us', 
      'admin/privacy-policy', 
      'admin/products', 
      'admin/faqs', 
      'admin/index-page', 
      'admin/dashboard',
      'admin/enquiries',
      'admin/site-settings',
      'admin/admin-management'
    );
  }
} 