import { Injectable, Logger } from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import { loadStorageConfig } from '../../config/storage.config';

@Injectable()
export class DocumentStorageService {
  private readonly logger = new Logger(DocumentStorageService.name);
  private readonly bucket: string;
  private readonly client: MinioClient;
  private bucketReady?: Promise<void>;

  constructor() {
    const { bucket, ...clientOptions } = loadStorageConfig();
    this.bucket = bucket;
    this.client = new MinioClient(clientOptions);
  }

  async createPresignedUploadUrl(
    objectName: string,
    expiresInSeconds = 15 * 60,
  ) {
    await this.ensureBucket();
    return this.client.presignedPutObject(
      this.bucket,
      objectName,
      expiresInSeconds,
    );
  }

  /**
   * URL đọc file, hạn ngắn. Người xem không gọi URL này trực tiếp: MinIO nằm
   * trong mạng nội bộ, nên route của web fetch bằng URL này ở phía server rồi
   * mới đẩy bytes về trình duyệt — đối xứng với đường upload.
   */
  async createPresignedDownloadUrl(
    objectName: string,
    expiresInSeconds = 5 * 60,
  ) {
    await this.ensureBucket();
    return this.client.presignedGetObject(
      this.bucket,
      objectName,
      expiresInSeconds,
    );
  }

  /** Ghi file do chính core-api tải về (vd. đề cương lấy từ Canvas). */
  async putObject(objectName: string, content: Buffer, contentType: string) {
    await this.ensureBucket();
    await this.client.putObject(this.bucket, objectName, content, content.length, {
      'Content-Type': contentType,
    });
  }

  private ensureBucket() {
    this.bucketReady ??= this.ensureBucketExists().catch((error: unknown) => {
      this.bucketReady = undefined;
      throw error;
    });
    return this.bucketReady;
  }

  private async ensureBucketExists() {
    if (await this.client.bucketExists(this.bucket)) {
      return;
    }

    try {
      await this.client.makeBucket(this.bucket);
    } catch (error: unknown) {
      // Another request may have created the bucket between the check and create.
      if (!(await this.client.bucketExists(this.bucket))) {
        this.logger.warn(
          `[storage] bucket check notice: ${(error as Error)?.message || error}`,
        );
      }
    }
  }
}
