import { Module } from '@nestjs/common';
import { ClientIndexPageController } from './index-page.controller';
import { ClientIndexPageService } from './services/index-page.service';

@Module({
  controllers: [ClientIndexPageController],
  providers: [ClientIndexPageService],
})
export class ClientModule {} 