import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '@zuzz/database';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('סוג קובץ לא נתמך'));
    }
  },
});

export const uploadRouter = Router();

// Upload media for listing
uploadRouter.post('/listing/:listingId/media', authenticate, upload.array('files', 20), async (req, res, next) => {
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

    const media = await Promise.all(
      files.map((file, index) =>
        prisma.listingMedia.create({
          data: {
            listingId: req.params.listingId!,
            url: `/uploads/${file.filename}`,
            thumbnailUrl: `/uploads/${file.filename}`,
            type: file.mimetype.startsWith('image/') ? 'image' : 'document',
            mimeType: file.mimetype,
            size: file.size,
            order: existingCount + index,
          },
        }),
      ),
    );

    res.json({ success: true, data: media });
  } catch (err) {
    next(err);
  }
});

// Upload document for listing
uploadRouter.post('/listing/:listingId/document', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.listingId! } });
    if (!listing || listing.userId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
    }

    const file = req.file;
    if (!file) {
      throw new AppError(400, 'NO_FILE', 'לא נבחר קובץ');
    }

    const doc = await prisma.listingDocument.create({
      data: {
        listingId: req.params.listingId!,
        type: req.body.type || 'other',
        url: `/uploads/${file.filename}`,
        name: file.originalname,
      },
    });

    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

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

    await prisma.listingMedia.delete({ where: { id: req.params.id } });

    // Try to delete file from disk
    const filePath = path.join(process.cwd(), media.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Reorder media
uploadRouter.put('/listing/:listingId/media/reorder', authenticate, async (req, res, next) => {
  try {
    const { order } = req.body; // Array of { id, order }
    if (!Array.isArray(order)) {
      throw new AppError(400, 'INVALID', 'סדר לא תקין');
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
