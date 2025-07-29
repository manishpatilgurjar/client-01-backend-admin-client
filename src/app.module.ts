import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseProvider } from './db';
import { AdminModule } from './admin/admin.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [LoggerModule, AdminModule],
  controllers: [AppController],
  providers: [AppService, DatabaseProvider],
})
export class AppModule {}
