import { Client as MinioClient } from 'minio';
import { DocumentStorageService } from './document-storage.service';

describe('DocumentStorageService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a missing bucket before signing an upload URL', async () => {
    const bucketExists = jest
      .spyOn(MinioClient.prototype, 'bucketExists')
      .mockResolvedValue(false);
    const makeBucket = jest
      .spyOn(MinioClient.prototype, 'makeBucket')
      .mockResolvedValue(undefined);
    const presign = jest
      .spyOn(MinioClient.prototype, 'presignedPutObject')
      .mockResolvedValue('http://minio:9000/documents/test.pdf');
    const storage = new DocumentStorageService();

    await expect(
      storage.createPresignedUploadUrl('course/test.pdf'),
    ).resolves.toBe('http://minio:9000/documents/test.pdf');

    expect(bucketExists).toHaveBeenCalledWith('documents');
    expect(makeBucket).toHaveBeenCalledWith('documents');
    expect(presign).toHaveBeenCalledWith(
      'documents',
      'course/test.pdf',
      15 * 60,
    );
  });

  it('checks bucket readiness only once per service instance', async () => {
    const bucketExists = jest
      .spyOn(MinioClient.prototype, 'bucketExists')
      .mockResolvedValue(true);
    const makeBucket = jest.spyOn(MinioClient.prototype, 'makeBucket');
    const presign = jest
      .spyOn(MinioClient.prototype, 'presignedPutObject')
      .mockResolvedValue('http://minio:9000/documents/test.pdf');
    const storage = new DocumentStorageService();

    await storage.createPresignedUploadUrl('course/one.pdf');
    await storage.createPresignedUploadUrl('course/two.pdf');

    expect(bucketExists).toHaveBeenCalledTimes(1);
    expect(makeBucket).not.toHaveBeenCalled();
    expect(presign).toHaveBeenCalledTimes(2);
  });
});
