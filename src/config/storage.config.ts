export interface StorageConfig {
  bucket: string;
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
}

export function loadStorageConfig(): StorageConfig {
  const endpoint = process.env.MINIO__ENDPOINT || 'minio:9000';
  const [host, rawPort] = endpoint.split(':');
  const useSSL = process.env.MINIO__SECURE === 'true';

  return {
    bucket: process.env.MINIO__BUCKET_NAME || 'documents',
    endPoint: host,
    port: rawPort ? Number(rawPort) : useSSL ? 443 : 9000,
    useSSL,
    accessKey: process.env.MINIO__ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO__SECRET_KEY || 'minioadmin',
    // Cloudflare R2 dùng region "auto". Có region thì minio-js bỏ qua bước dò
    // region của bucket (một request riêng, R2 có thể không trả lời được).
    // Để trống thì giữ hành vi cũ — MinIO tự dựng, B2.
    ...(process.env.MINIO__REGION ? { region: process.env.MINIO__REGION } : {}),
  };
}
