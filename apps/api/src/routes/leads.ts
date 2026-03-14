import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const leadsRouter = Router();

const VALID_LEAD_TYPES = ['contact', 'test_drive', 'inspection', 'financing', 'offer'] as const;
const VALID_LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;

// Create lead
leadsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { listingId, type, message, phone, email } = req.body;

    if (!listingId) throw new AppError(400, 'INVALID', 'יש לספק מזהה מודעה');

    const leadType = type || 'contact';
    if (!VALID_LEAD_TYPES.includes(leadType)) {
      throw new AppError(400, 'INVALID', 'סוג ליד לא תקין');
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');

    if (listing.userId === req.user!.id) {
      throw new AppError(400, 'INVALID', 'לא ניתן ליצור ליד למודעה שלך');
    }

    const lead = await prisma.lead.create({
      data: {
        listingId,
        buyerId: req.user!.id,
        sellerId: listing.userId,
        type: leadType,
        message: message?.slice(0, 1000),
        phone,
        email,
      },
    });

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'lead_received',
        title: 'ליד חדש',
        body: `התקבל ליד חדש עבור "${listing.title}"`,
        link: `/dashboard/leads`,
      },
    });

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
});

// Get leads for seller
leadsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const status = req.query.status as string;
    const where: any = { sellerId: req.user!.id };
    if (status) where.status = status;

    const leads = await prisma.lead.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true, vertical: true } },
        buyer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: leads });
  } catch (err) {
    next(err);
  }
});

// Update lead status
leadsRouter.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead || lead.sellerId !== req.user!.id) {
      throw new AppError(404, 'NOT_FOUND', 'ליד לא נמצא');
    }

    const newStatus = req.body.status;
    if (!VALID_LEAD_STATUSES.includes(newStatus)) {
      throw new AppError(400, 'INVALID', 'סטטוס לא תקין');
    }

    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        status: newStatus,
        respondedAt: newStatus === 'contacted' ? new Date() : undefined,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
