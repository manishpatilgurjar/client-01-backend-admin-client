import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseProvider } from './db';
import { AdminModule } from './admin/admin.module';
import { LoggerModule } from './common/logger/logger.module';
import { AboutUsService } from './admin/services/about-us.service';

@Module({
  imports: [LoggerModule, AdminModule],
  controllers: [AppController],
  providers: [AppService, DatabaseProvider, AboutUsService],
})
export class AppModule {}
