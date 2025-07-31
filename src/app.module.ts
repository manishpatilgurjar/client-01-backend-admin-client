import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseProvider } from './db';
import { AdminModule } from './admin/admin.module';
import { ClientModule } from './client/client.module';
import { LoggerModule } from './common/logger/logger.module';
import { ClientAboutUsService } from './client/services/about-us.service';
import { S3UploadService } from './common/services/s3-upload.service';

@Module({
  imports: [LoggerModule, AdminModule, ClientModule],
  controllers: [AppController],
  providers: [AppService, DatabaseProvider, ClientAboutUsService, S3UploadService],
})
export class AppModule {}
