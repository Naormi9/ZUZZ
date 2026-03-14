import type { StorageConfig, UploadOptions, UploadResult, SignedUrlOptions } from './types';

export type { StorageConfig, UploadOptions, UploadResult, SignedUrlOptions } from './types';

export interface StorageProvider {
  /** Upload a file to storage */
  upload(options: UploadOptions): Promise<UploadResult>;
  /** Delete a file from storage */
  delete(key: string): Promise<void>;
  /** Get the public URL for a key */
  getUrl(key: string): string;
  /** Get a signed/temporary URL for a key */
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
}

export function createStorageProvider(config: StorageConfig): StorageProvider {
  switch (config.provider) {
    case 's3': {
      const { S3StorageProvider } = require('./providers/s3') as typeof import('./providers/s3');
      return new S3StorageProvider(config);
    }
    case 'local': {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'Local storage provider is not allowed in production. Use S3-compatible storage.',
        );
      }
      const { LocalStorageProvider } =
        require('./providers/local') as typeof import('./providers/local');
      return new LocalStorageProvider(config.bucket, config.publicUrl);
    }
    default:
      throw new Error(`Unknown storage provider: ${(config as StorageConfig).provider}`);
  }
}

export { S3StorageProvider } from './providers/s3';
export { LocalStorageProvider } from './providers/local';
