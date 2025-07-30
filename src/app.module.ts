import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseProvider } from './db';
import { AdminModule } from './admin/admin.module';
import { LoggerModule } from './common/logger/logger.module';
import { AboutUsService } from './admin/services/about-us.service';
import { S3UploadService } from './common/services/s3-upload.service';

@Module({
  imports: [LoggerModule, AdminModule],
  controllers: [AppController],
  providers: [AppService, DatabaseProvider, AboutUsService, S3UploadService],
})
export class AppModule {}
