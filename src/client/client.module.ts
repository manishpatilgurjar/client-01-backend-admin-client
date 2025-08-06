import { Module } from '@nestjs/common';
import { ClientIndexPageController } from './index-page.controller';
import { ClientIndexPageService } from './services/index-page.service';
import { ClientProductController } from './controllers/product.controller';
import { ClientProductService } from './services/product.service';
import { ClientAboutUsController } from './controllers/about-us.controller';
import { ClientAboutUsService } from './services/about-us.service';
import { ClientSiteSettingsController } from './controllers/site-settings.controller';
import { ClientSiteSettingsService } from './services/site-settings.service';
import { ClientContactUsController } from './controllers/contact-us.controller';
import { ClientContactUsService } from './services/contact-us.service';
import { ClientFooterController } from './controllers/footer.controller';
import { ClientPrivacyPolicyController } from './controllers/privacy-policy.controller';
import { ClientPrivacyPolicyService } from './services/privacy-policy.service';

@Module({
  controllers: [
    ClientIndexPageController, 
    ClientProductController, 
    ClientAboutUsController, 
    ClientSiteSettingsController, 
    ClientContactUsController,
    ClientFooterController,
    ClientPrivacyPolicyController
  ],
  providers: [
    ClientIndexPageService, 
    ClientProductService, 
    ClientAboutUsService, 
    ClientSiteSettingsService, 
    ClientContactUsService,
    ClientPrivacyPolicyService
  ],
})
export class ClientModule {} 