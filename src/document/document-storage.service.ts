import { Injectable } from '@nestjs/common';
import { Client as MinioClient } from 'minio';

const DEFAULT_BUCKET = process.env.MINIO__BUCKET_NAME || 'documents';

function createClient() {
  const endpoint = process.env.MINIO__ENDPOINT || 'minio:9000';
  const [host, rawPort] = endpoint.split(':');

  return new MinioClient({
    endPoint: host,
    port: rawPort ? Number(rawPort) : 9000,
    useSSL: process.env.MINIO__SECURE === 'true',
    accessKey: process.env.MINIO__ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO__SECRET_KEY || 'minioadmin',
  });
}

@Injectable()
export class DocumentStorageService {
  private readonly client = createClient();
  private bucketReady?: Promise<void>;

  async createPresignedUploadUrl(
    objectName: string,
    expiresInSeconds = 15 * 60,
  ) {
    await this.ensureBucket();
    return this.client.presignedPutObject(
      DEFAULT_BUCKET,
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
      DEFAULT_BUCKET,
      objectName,
      expiresInSeconds,
    );
  }

  /** Ghi file do chính core-api tải về (vd. đề cương lấy từ Canvas). */
  async putObject(objectName: string, content: Buffer, contentType: string) {
    await this.ensureBucket();
    await this.client.putObject(DEFAULT_BUCKET, objectName, content, content.length, {
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
    if (await this.client.bucketExists(DEFAULT_BUCKET)) {
      return;
    }

    try {
      await this.client.makeBucket(DEFAULT_BUCKET);
    } catch (error: unknown) {
      // Another request may have created the bucket between the check and create.
      if (!(await this.client.bucketExists(DEFAULT_BUCKET))) {
        throw error;
      }
    }
  }
}
