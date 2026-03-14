import * as fs from 'node:fs';
import * as path from 'node:path';
import type { StorageProvider } from '../index';
import type { UploadOptions, UploadResult, SignedUrlOptions } from '../types';

/**
 * Local filesystem storage provider for development and testing.
 * Stores files in a local directory.
 */
export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  private publicUrl: string;

  constructor(baseDir: string, publicUrl?: string) {
    this.baseDir = baseDir;
    this.publicUrl = publicUrl ?? `file://${baseDir}`;
    fs.mkdirSync(baseDir, { recursive: true });
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const { key, body, contentType } = options;
    const filePath = this.resolveKey(key);

    const buffer = Buffer.isBuffer(body) ? body : await this.streamToBuffer(body);

    if (options.maxSize && buffer.length > options.maxSize) {
      throw new Error(`File size ${buffer.length} exceeds maximum allowed size ${options.maxSize}`);
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(filePath, buffer);

    // Write a sidecar metadata file
    const meta = {
      contentType,
      metadata: options.metadata ?? {},
      isPublic: options.isPublic ?? false,
      uploadedAt: new Date().toISOString(),
    };
    fs.writeFileSync(`${filePath}.meta.json`, JSON.stringify(meta, null, 2));

    return {
      key,
      url: this.getUrl(key),
      size: buffer.length,
      contentType,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolveKey(key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const metaPath = `${filePath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
  }

  getUrl(key: string): string {
    return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
  }

  async getSignedUrl(key: string, _options?: SignedUrlOptions): Promise<string> {
    // Local provider doesn't need signed URLs; return a regular URL
    return this.getUrl(key);
  }

  private resolveKey(key: string): string {
    return path.join(this.baseDir, key);
  }

  private async streamToBuffer(stream: import('node:stream').Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
