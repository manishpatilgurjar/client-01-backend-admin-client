import { Module, Global } from '@nestjs/common';
import { CustomLoggerService } from './logger.service';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

@Global()
@Module({
  providers: [CustomLoggerService, LoggingInterceptor],
  exports: [CustomLoggerService, LoggingInterceptor],
})
export class LoggerModule {} 