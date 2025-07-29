import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Log incoming request
    this.logger.logIncomingRequest(request, context.getClass().name);

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        this.logger.logOutgoingResponse(
          request,
          response,
          responseTime,
          context.getClass().name,
        );
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        this.logger.logRequestError(
          request,
          error,
          responseTime,
          context.getClass().name,
        );
        throw error;
      }),
    );
  }
} 