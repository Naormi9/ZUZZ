import { createStorageProvider, type StorageProvider } from '@zuzz/storage';
import { createLogger } from '@zuzz/logger';

const logger = createLogger('api:storage');

let _storage: StorageProvider | null = null;

/**
 * Returns the configured storage provider singleton.
 *
 * In production, uses S3/MinIO (via STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, etc.).
 * In development without S3 config, falls back to local filesystem.
 */
export function getStorage(): StorageProvider {
  if (_storage) return _storage;

  const hasS3Config =
    process.env.STORAGE_ENDPOINT &&
    process.env.STORAGE_ACCESS_KEY &&
    process.env.STORAGE_SECRET_KEY;

  if (hasS3Config) {
    logger.info(
      { endpoint: process.env.STORAGE_ENDPOINT, bucket: process.env.STORAGE_BUCKET },
      'Initializing S3/MinIO storage provider',
    );
    _storage = createStorageProvider({
      provider: 's3',
      bucket: process.env.STORAGE_BUCKET || 'zuzz-media',
      region: process.env.STORAGE_REGION || 'us-east-1',
      endpoint: process.env.STORAGE_ENDPOINT,
      accessKeyId: process.env.STORAGE_ACCESS_KEY,
      secretAccessKey: process.env.STORAGE_SECRET_KEY,
      forcePathStyle: true, // Required for MinIO
      publicUrl: process.env.STORAGE_PUBLIC_URL || `${process.env.STORAGE_ENDPOINT}/${process.env.STORAGE_BUCKET || 'zuzz-media'}`,
    });
  } else {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    logger.info({ uploadDir }, 'Initializing local storage provider (dev fallback)');
    _storage = createStorageProvider({
      provider: 'local',
      bucket: uploadDir,
      publicUrl: `${apiUrl}/uploads`,
    });
  }

  return _storage;
}
