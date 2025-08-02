import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as multer from 'multer';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const url = request.url;
    const method = request.method;

    console.log(`🔍 [FileUpload] Starting upload process for ${method} ${url}`);
    console.log(`🔍 [FileUpload] Request headers:`, {
      'content-type': request.headers['content-type'],
      'content-length': request.headers['content-length']
    });

    return new Observable((observer) => {
      // Create multer instance
      const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB limit
        },
        fileFilter: (req, file, cb) => {
          console.log(`🔍 [FileUpload] FileFilter called for:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          });
          
          // Accept all files for now
          console.log(`✅ [FileUpload] File accepted: ${file.originalname}`);
          cb(null, true);
        },
      }).any(); // Use .any() to accept any field name

      upload(request, response, (err: any) => {
        if (err) {
          console.log(`❌ [FileUpload] Multer error:`, err);
          if (err.code === 'LIMIT_FILE_SIZE') {
            observer.error(new BadRequestException('File size too large. Maximum size is 5MB'));
          } else {
            observer.error(new BadRequestException(`Upload failed: ${err.message}`));
          }
          return;
        }

        console.log(`✅ [FileUpload] Multer processing completed`);
        console.log(`📁 [FileUpload] Files found:`, request.files?.length || 0);
        
        if (request.files && request.files.length > 0) {
          // Get the first file (assuming single file upload)
          const file = request.files[0];
          console.log(`📁 [FileUpload] File details:`, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            fieldname: file.fieldname,
            buffer: file.buffer ? `Buffer size: ${file.buffer.length}` : 'No buffer'
          });
          
          // Attach the file to request.file for compatibility
          request.file = file;
        } else {
          console.log(`❌ [FileUpload] No files found in request`);
          observer.error(new BadRequestException('No file uploaded'));
          return;
        }

        // Continue with the request
        next.handle().subscribe({
          next: (data) => {
            console.log(`✅ [FileUpload] Request completed successfully`);
            observer.next(data);
          },
          error: (error) => {
            console.log(`❌ [FileUpload] Request failed:`, error);
            observer.error(error);
          },
          complete: () => {
            console.log(`🏁 [FileUpload] Request completed`);
            observer.complete();
          },
        });
      });
    });
  }

  /**
   * Creates a file upload interceptor for a specific field name
   */
  static forField(fieldName: string) {
    return new (class extends FileUploadInterceptor {
      intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        return new Observable((observer) => {
          console.log(`🔍 [FileUpload] Using specific field: '${fieldName}'`);
          
          const upload = multer({
            storage: multer.memoryStorage(),
            limits: {
              fileSize: 5 * 1024 * 1024, // 5MB limit
            },
            fileFilter: (req, file, cb) => {
              console.log(`🔍 [FileUpload] FileFilter called for:`, {
                fieldname: file.fieldname,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
              });
              
              // Accept all files for now
              console.log(`✅ [FileUpload] File accepted: ${file.originalname}`);
              cb(null, true);
            },
          }).single(fieldName);
          
          upload(request, response, (err: any) => {
            if (err) {
              console.log(`❌ [FileUpload] Error with field '${fieldName}':`, err);
              if (err.code === 'LIMIT_FILE_SIZE') {
                observer.error(new BadRequestException('File size too large. Maximum size is 5MB'));
              } else {
                observer.error(new BadRequestException(`Upload failed: ${err.message}`));
              }
              return;
            }

            console.log(`✅ [FileUpload] File processed successfully`);
            console.log(`📁 [FileUpload] File details:`, {
              originalname: request.file?.originalname,
              mimetype: request.file?.mimetype,
              size: request.file?.size,
              fieldname: request.file?.fieldname,
              buffer: request.file?.buffer ? `Buffer size: ${request.file.buffer.length}` : 'No buffer'
            });

            next.handle().subscribe({
              next: (data) => observer.next(data),
              error: (error) => observer.error(error),
              complete: () => observer.complete(),
            });
          });
        });
      }
    })();
  }
} 