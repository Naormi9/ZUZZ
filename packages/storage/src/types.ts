export interface StorageConfig {
  provider: 's3' | 'local';
  /** S3/MinIO bucket name or local base directory */
  bucket: string;
  /** S3/MinIO region */
  region?: string;
  /** S3/MinIO endpoint (required for MinIO) */
  endpoint?: string;
  /** AWS access key or MinIO user */
  accessKeyId?: string;
  /** AWS secret key or MinIO password */
  secretAccessKey?: string;
  /** Force path-style URLs (required for MinIO) */
  forcePathStyle?: boolean;
  /** Base URL for public access */
  publicUrl?: string;
}

export interface UploadOptions {
  /** Storage key / path within the bucket */
  key: string;
  /** File content as Buffer or readable stream */
  body: Buffer | import('node:stream').Readable;
  /** MIME type */
  contentType: string;
  /** Whether the file should be publicly readable */
  isPublic?: boolean;
  /** Optional metadata */
  metadata?: Record<string, string>;
  /** Max content length in bytes */
  maxSize?: number;
}

export interface UploadResult {
  /** The storage key */
  key: string;
  /** Public URL if available */
  url: string;
  /** File size in bytes */
  size: number;
  /** The content type */
  contentType: string;
  /** ETag if available */
  etag?: string;
}

export interface SignedUrlOptions {
  /** Expiration in seconds (default 3600) */
  expiresIn?: number;
}
