import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const leadsRouter = Router();

// Create lead
leadsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { listingId, type, message, phone, email } = req.body;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');

    const lead = await prisma.lead.create({
      data: {
        listingId,
        buyerId: req.user!.id,
        sellerId: listing.userId,
        type: type || 'contact',
        message,
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

    const updated = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        respondedAt: req.body.status === 'contacted' ? new Date() : undefined,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
