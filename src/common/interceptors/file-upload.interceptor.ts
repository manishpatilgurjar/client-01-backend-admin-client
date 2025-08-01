import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as multer from 'multer';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  private upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow only images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
  }).single('file');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return new Observable((observer) => {
      this.upload(request, response, (err: any) => {
        if (err) {
          observer.error(err);
          return;
        }

        // Continue with the request
        next.handle().subscribe({
          next: (data) => observer.next(data),
          error: (error) => observer.error(error),
          complete: () => observer.complete(),
        });
      });
    });
  }
} 