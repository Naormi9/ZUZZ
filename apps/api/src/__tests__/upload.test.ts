import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { createTestApp } from './create-app';
import { prisma } from '@zuzz/database';
import { generateToken, testUser } from './helpers';

const app = createTestApp();

const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
  listing: { findUnique: ReturnType<typeof vi.fn> };
  listingMedia: {
    create: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  listingDocument: { create: ReturnType<typeof vi.fn> };
};

let authToken: string;

// Create a temporary test file for uploads
const TEMP_DIR = path.join(process.cwd(), 'test-fixtures');
const VALID_JPEG_PATH = path.join(TEMP_DIR, 'test-image.jpg');
const VALID_PNG_PATH = path.join(TEMP_DIR, 'test-image.png');
const INVALID_FILE_PATH = path.join(TEMP_DIR, 'test-file.exe');
const PDF_PATH = path.join(TEMP_DIR, 'test-doc.pdf');

beforeEach(() => {
  vi.clearAllMocks();
  authToken = generateToken(testUser);

  // Ensure test fixtures directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Create minimal valid JPEG (JFIF header)
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);
  fs.writeFileSync(VALID_JPEG_PATH, jpegHeader);

  // Create minimal PNG
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  fs.writeFileSync(VALID_PNG_PATH, pngHeader);

  // Create a dummy .exe file
  fs.writeFileSync(INVALID_FILE_PATH, Buffer.from('MZ fake exe'));

  // Create a dummy PDF
  fs.writeFileSync(PDF_PATH, Buffer.from('%PDF-1.4 fake pdf'));
});

function mockAuthUser() {
  mockPrisma.user.findUnique.mockResolvedValueOnce({
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
    roles: testUser.roles,
    isActive: true,
  });
}

// ---------------------------------------------------------------------------
// POST /api/upload/listing/:listingId/media — Upload media files
// ---------------------------------------------------------------------------
describe('POST /api/upload/listing/:listingId/media', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/upload/listing/listing-1/media')
      .attach('files', VALID_JPEG_PATH);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('uploads valid JPEG images', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
    });
    mockPrisma.listingMedia.count.mockResolvedValueOnce(0);
    mockPrisma.listingMedia.create.mockResolvedValueOnce({
      id: 'media-1',
      listingId: 'listing-1',
      url: '/uploads/test.jpg',
      type: 'image',
    });

    const res = await request(app)
      .post('/api/upload/listing/listing-1/media')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('files', VALID_JPEG_PATH);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects non-allowed MIME types', async () => {
    mockAuthUser();

    const res = await request(app)
      .post('/api/upload/listing/listing-1/media')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('files', INVALID_FILE_PATH);

    // multer file filter error typically results in a 500 (unhandled Error from multer)
    // or the error handler catches it
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('returns 404 when listing does not belong to user', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: 'other-user',
    });

    const res = await request(app)
      .post('/api/upload/listing/listing-1/media')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('files', VALID_JPEG_PATH);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 when no files are attached', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
    });

    const res = await request(app)
      .post('/api/upload/listing/listing-1/media')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NO_FILES');
  });

  it('returns 400 when exceeding max media files limit', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
    });
    mockPrisma.listingMedia.count.mockResolvedValueOnce(19); // already 19 files
    mockPrisma.listingMedia.create.mockResolvedValueOnce({
      id: 'media-new',
      listingId: 'listing-1',
      url: '/uploads/test.jpg',
      type: 'image',
    });

    const res = await request(app)
      .post('/api/upload/listing/listing-1/media')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('files', VALID_JPEG_PATH)
      .attach('files', VALID_PNG_PATH);

    // 19 existing + 2 new = 21 > 20
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOO_MANY_FILES');
  });
});

// ---------------------------------------------------------------------------
// POST /api/upload/listing/:listingId/document — Upload document
// ---------------------------------------------------------------------------
describe('POST /api/upload/listing/:listingId/document', () => {
  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/upload/listing/listing-1/document')
      .attach('file', VALID_JPEG_PATH);

    expect(res.status).toBe(401);
  });

  it('returns 404 when listing does not belong to user', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/upload/listing/listing-1/document')
      .set('Authorization', `Bearer ${authToken}`)
      .field('type', 'vehicle_license')
      .attach('file', VALID_JPEG_PATH);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid document type', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
    });

    const res = await request(app)
      .post('/api/upload/listing/listing-1/document')
      .set('Authorization', `Bearer ${authToken}`)
      .field('type', 'invalid_type')
      .attach('file', VALID_JPEG_PATH);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DOC_TYPE');
  });

  it('returns 400 when no file is attached', async () => {
    mockAuthUser();
    mockPrisma.listing.findUnique.mockResolvedValueOnce({
      id: 'listing-1',
      userId: testUser.id,
    });

    const res = await request(app)
      .post('/api/upload/listing/listing-1/document')
      .set('Authorization', `Bearer ${authToken}`)
      .field('type', 'vehicle_license');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NO_FILE');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/upload/media/:id — Delete media
// ---------------------------------------------------------------------------
describe('DELETE /api/upload/media/:id', () => {
  it('requires authentication', async () => {
    const res = await request(app).delete('/api/upload/media/media-1');

    expect(res.status).toBe(401);
  });

  it('returns 404 when media not found or not owned', async () => {
    mockAuthUser();
    mockPrisma.listingMedia.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .delete('/api/upload/media/nonexistent')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 when media belongs to different user', async () => {
    mockAuthUser();
    mockPrisma.listingMedia.findUnique.mockResolvedValueOnce({
      id: 'media-1',
      url: '/uploads/test.jpg',
      listing: { userId: 'other-user' },
    });

    const res = await request(app)
      .delete('/api/upload/media/media-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('deletes media owned by authenticated user', async () => {
    mockAuthUser();
    mockPrisma.listingMedia.findUnique.mockResolvedValueOnce({
      id: 'media-1',
      url: '/uploads/nonexistent-file.jpg',
      listing: { userId: testUser.id },
    });
    mockPrisma.listingMedia.delete.mockResolvedValueOnce({});

    const res = await request(app)
      .delete('/api/upload/media/media-1')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockPrisma.listingMedia.delete).toHaveBeenCalledWith({
      where: { id: 'media-1' },
    });
  });
});
