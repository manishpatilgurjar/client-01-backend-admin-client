import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { MailService } from '../mail/mail.service';
import { ProfileController } from './controllers/profile.controller';
import { AdminAuthMiddleware } from './middleware/auth.middleware';
import { AboutUsController } from './controllers/about-us.controller';
import { AboutUsService } from './services/about-us.service';
import { PrivacyPolicyController } from './controllers/privacy-policy.controller';
import { PrivacyPolicyService } from './services/privacy-policy.service';

/**
 * AdminModule bundles all admin-related controllers and services.
 * Import this module in AppModule to enable admin APIs.
 */
@Module({
  controllers: [AuthController, ProfileController, AboutUsController, PrivacyPolicyController],
  providers: [AuthService, MailService, AboutUsService, PrivacyPolicyService],
  exports: [AuthService],
})
export class AdminModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminAuthMiddleware).forRoutes('admin/profile', 'admin/about-us', 'admin/privacy-policy');
  }
} 