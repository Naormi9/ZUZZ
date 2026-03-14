import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '@zuzz/database';
import { createLogger } from '@zuzz/logger';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { getStorage } from '../lib/storage';

const logger = createLogger('api:upload');

// Allowed MIME types and corresponding extensions
const ALLOWED_MEDIA_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const ALLOWED_DOCUMENT_TYPES: Record<string, string[]> = {
  ...ALLOWED_MEDIA_TYPES,
  'application/pdf': ['.pdf'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_MEDIA_FILES = 20;

function validateFileExtension(
  file: Express.Multer.File,
  allowedTypes: Record<string, string[]>,
): boolean {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeExtensions = allowedTypes[file.mimetype];
  if (!mimeExtensions) return false;
  return mimeExtensions.includes(ext);
}

function generateStorageKey(prefix: string, originalname: string): string {
  const ext = path.extname(originalname).toLowerCase();
  const hash = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  return `${prefix}/${timestamp}-${hash}${ext}`;
}

// Use memory storage so files go to buffer, then we push to the storage provider
const memoryStorage = multer.memoryStorage();

const mediaUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MEDIA_TYPES[file.mimetype]) {
      cb(new Error('סוג קובץ לא נתמך. ניתן להעלות: JPEG, PNG, WebP'));
      return;
    }
    if (!validateFileExtension(file, ALLOWED_MEDIA_TYPES)) {
      cb(new Error('סיומת הקובץ לא תואמת את סוג הקובץ'));
      return;
    }
    cb(null, true);
  },
});

const documentUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_DOCUMENT_TYPES[file.mimetype]) {
      cb(new Error('סוג קובץ לא נתמך. ניתן להעלות: JPEG, PNG, WebP, PDF'));
      return;
    }
    if (!validateFileExtension(file, ALLOWED_DOCUMENT_TYPES)) {
      cb(new Error('סיומת הקובץ לא תואמת את סוג הקובץ'));
      return;
    }
    cb(null, true);
  },
});

export const uploadRouter = Router();

// Upload media for listing
uploadRouter.post(
  '/listing/:listingId/media',
  authenticate,
  mediaUpload.array('files', MAX_MEDIA_FILES),
  async (req, res, next) => {
    try {
      const listing = await prisma.listing.findUnique({ where: { id: req.params.listingId! } });
      if (!listing || listing.userId !== req.user!.id) {
        throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
      }

      const files = req.files as Express.Multer.File[];
      if (!files?.length) {
        throw new AppError(400, 'NO_FILES', 'לא נבחרו קבצים');
      }

      const existingCount = await prisma.listingMedia.count({
        where: { listingId: req.params.listingId! },
      });

      if (existingCount + files.length > MAX_MEDIA_FILES) {
        throw new AppError(400, 'TOO_MANY_FILES', `ניתן להעלות עד ${MAX_MEDIA_FILES} קבצים`);
      }

      const storage = getStorage();

      const media = await Promise.all(
        files.map(async (file, index) => {
          const key = generateStorageKey(
            `listings/${req.params.listingId}/media`,
            file.originalname,
          );

          const result = await storage.upload({
            key,
            body: file.buffer,
            contentType: file.mimetype,
            isPublic: true,
            maxSize: MAX_FILE_SIZE,
          });

          return prisma.listingMedia.create({
            data: {
              listingId: req.params.listingId!,
              url: result.url,
              thumbnailUrl: result.url, // TODO: generate actual thumbnails
              type: 'image',
              mimeType: file.mimetype,
              size: result.size,
              order: existingCount + index,
            },
          });
        }),
      );

      logger.info(
        { listingId: req.params.listingId, count: files.length },
        'Media uploaded via storage provider',
      );
      res.json({ success: true, data: media });
    } catch (err) {
      next(err);
    }
  },
);

// Upload document for listing
uploadRouter.post(
  '/listing/:listingId/document',
  authenticate,
  documentUpload.single('file'),
  async (req, res, next) => {
    try {
      const listing = await prisma.listing.findUnique({ where: { id: req.params.listingId! } });
      if (!listing || listing.userId !== req.user!.id) {
        throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
      }

      const file = req.file;
      if (!file) {
        throw new AppError(400, 'NO_FILE', 'לא נבחר קובץ');
      }

      const validDocTypes = [
        'vehicle_license',
        'test_certificate',
        'insurance',
        'inspection_report',
        'ownership_proof',
        'other',
      ];
      const docType = req.body.type || 'other';
      if (!validDocTypes.includes(docType)) {
        throw new AppError(400, 'INVALID_DOC_TYPE', 'סוג מסמך לא תקין');
      }

      const storage = getStorage();
      const key = generateStorageKey(
        `listings/${req.params.listingId}/documents`,
        file.originalname,
      );

      const result = await storage.upload({
        key,
        body: file.buffer,
        contentType: file.mimetype,
        isPublic: false, // Documents are not publicly accessible by default
        maxSize: MAX_FILE_SIZE,
      });

      const doc = await prisma.listingDocument.create({
        data: {
          listingId: req.params.listingId!,
          type: docType,
          url: result.url,
          name: file.originalname.slice(0, 255),
        },
      });

      logger.info(
        { listingId: req.params.listingId, type: docType },
        'Document uploaded via storage provider',
      );
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  },
);

// Delete media
uploadRouter.delete('/media/:id', authenticate, async (req, res, next) => {
  try {
    const media = await prisma.listingMedia.findUnique({
      where: { id: req.params.id },
      include: { listing: true },
    });

    if (!media || media.listing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'קובץ לא נמצא');
    }

    // Try to delete from storage provider
    try {
      const storage = getStorage();
      // Extract key from URL — the key is the path after the bucket/base URL
      const url = media.url;
      // For S3 URLs the key is embedded in the URL path; for local it's the relative path
      // We try to extract it; worst case we just delete the DB record
      const urlObj = new URL(url, 'http://localhost');
      const key = urlObj.pathname.replace(/^\//, '');
      if (key) {
        await storage.delete(key);
      }
    } catch (err) {
      logger.warn(
        { mediaId: req.params.id, err },
        'Failed to delete file from storage, DB record will still be removed',
      );
    }

    await prisma.listingMedia.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Reorder media
uploadRouter.put('/listing/:listingId/media/reorder', authenticate, async (req, res, next) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      throw new AppError(400, 'INVALID', 'סדר לא תקין');
    }

    // Validate listing ownership
    const listing = await prisma.listing.findUnique({ where: { id: req.params.listingId } });
    if (!listing || listing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    // Verify all media IDs belong to this listing to prevent cross-listing manipulation
    const mediaIds = order.map((item: { id: string; order: number }) => item.id);
    const existingMedia = await prisma.listingMedia.count({
      where: { id: { in: mediaIds }, listingId: req.params.listingId! },
    });
    if (existingMedia !== mediaIds.length) {
      throw new AppError(400, 'INVALID', 'חלק מהקבצים אינם שייכים למודעה זו');
    }

    await Promise.all(
      order.map((item: { id: string; order: number }) =>
        prisma.listingMedia.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
