import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'ecomm-bucket-mp';
  }

  /**
   * Upload file to S3
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    console.log(`🔍 [S3Upload] uploadFile called with folder: ${folder}`);
    console.log(`📁 [S3Upload] File details:`, {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      buffer: file?.buffer ? `Buffer size: ${file.buffer.length}` : 'No buffer'
    });

    if (!file) {
      console.log(`❌ [S3Upload] File is null/undefined`);
      throw new Error('File is required for upload');
    }

    if (!file.originalname) {
      console.log(`❌ [S3Upload] File originalname is missing`);
      throw new Error('File originalname is required');
    }

    if (!file.buffer) {
      console.log(`❌ [S3Upload] File buffer is missing`);
      throw new Error('File buffer is required');
    }

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    console.log(`📝 [S3Upload] Generated filename: ${fileName}`);
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    console.log(`🔄 [S3Upload] Sending command to S3 with bucket: ${this.bucketName}`);
    try {
      await this.s3Client.send(command);
      console.log(`✅ [S3Upload] File uploaded to S3 successfully`);
      
      const imageUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileName}`;
      console.log(`🔗 [S3Upload] Generated URL: ${imageUrl}`);
      
      return imageUrl;
    } catch (error) {
      console.log(`❌ [S3Upload] S3 upload failed:`, error);
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl || !fileUrl.includes(this.bucketName)) {
      return;
    }

    const key = fileUrl.split(`${this.bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/`)[1];
    
    if (!key) {
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate presigned URL for direct upload
   */
  async generatePresignedUrl(fileName: string, contentType: string, folder: string = 'uploads'): Promise<string> {
    const key = `${folder}/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
} 