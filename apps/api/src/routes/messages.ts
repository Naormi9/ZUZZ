import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { notifyUser } from '../lib/push';

export const messagesRouter = Router();

// Get conversations
messagesRouter.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: req.user!.id }, { sellerId: req.user!.id }],
        status: 'active',
      },
      include: {
        listing: {
          select: { id: true, title: true, priceAmount: true, priceCurrency: true, vertical: true },
        },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const data = conversations.map((conv: any) => ({
      ...conv,
      unreadCount: conv.buyerId === req.user!.id ? conv.buyerUnreadCount : conv.sellerUnreadCount,
      otherUser: conv.buyerId === req.user!.id ? conv.seller : conv.buyer,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Get messages in conversation
messagesRouter.get('/conversations/:id', authenticate, async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
    });

    if (!conversation) {
      throw new AppError(404, 'NOT_FOUND', 'שיחה לא נמצאה');
    }

    if (conversation.buyerId !== req.user!.id && conversation.sellerId !== req.user!.id) {
      throw new AppError(403, 'FORBIDDEN', 'אין הרשאה');
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      include: {
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark as read
    const isBuyer = conversation.buyerId === req.user!.id;
    if (isBuyer) {
      await prisma.conversation.update({
        where: { id: req.params.id },
        data: { buyerUnreadCount: 0 },
      });
    } else {
      await prisma.conversation.update({
        where: { id: req.params.id },
        data: { sellerUnreadCount: 0 },
      });
    }

    await prisma.message.updateMany({
      where: {
        conversationId: req.params.id,
        senderId: { not: req.user!.id },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

// Send message (or start conversation)
messagesRouter.post('/send', authenticate, async (req, res, next) => {
  try {
    const { listingId, content, conversationId } = req.body;

    if (!content?.trim()) {
      throw new AppError(400, 'INVALID', 'תוכן ההודעה ריק');
    }

    if (content.length > 5000) {
      throw new AppError(400, 'INVALID', 'ההודעה ארוכה מדי (מקסימום 5000 תווים)');
    }

    let conv;

    if (conversationId) {
      conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conv || (conv.buyerId !== req.user!.id && conv.sellerId !== req.user!.id)) {
        throw new AppError(403, 'FORBIDDEN', 'אין הרשאה');
      }
    } else if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) throw new AppError(404, 'NOT_FOUND', 'מודעה לא נמצאה');
      if (listing.userId === req.user!.id) {
        throw new AppError(400, 'INVALID', 'לא ניתן לשלוח הודעה לעצמך');
      }

      conv = await prisma.conversation.findUnique({
        where: {
          listingId_buyerId: { listingId, buyerId: req.user!.id },
        },
      });

      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            listingId,
            buyerId: req.user!.id,
            sellerId: listing.userId,
          },
        });
      }
    } else {
      throw new AppError(400, 'INVALID', 'יש לספק מזהה מודעה או שיחה');
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: req.user!.id,
        content: content.trim(),
        type: 'text',
      },
    });

    // Update conversation
    const isBuyer = conv.buyerId === req.user!.id;
    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content.trim().slice(0, 100),
        ...(isBuyer
          ? { sellerUnreadCount: { increment: 1 } }
          : { buyerUnreadCount: { increment: 1 } }),
      },
    });

    // Send push notification to the other party
    const recipientId = isBuyer ? conv.sellerId : conv.buyerId;
    notifyUser(
      recipientId,
      'new_message',
      'הודעה חדשה',
      content.trim().slice(0, 100),
      `/dashboard/messages/${conv.id}`,
      { conversationId: conv.id },
    ).catch(() => {}); // fire-and-forget

    res.status(201).json({ success: true, data: { message, conversationId: conv.id } });
  } catch (err) {
    next(err);
  }
});

// Get unread count
messagesRouter.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: req.user!.id, buyerUnreadCount: { gt: 0 } },
          { sellerId: req.user!.id, sellerUnreadCount: { gt: 0 } },
        ],
      },
    });

    const total = conversations.reduce((sum: number, conv: any) => {
      if (conv.buyerId === req.user!.id) return sum + conv.buyerUnreadCount;
      return sum + conv.sellerUnreadCount;
    }, 0);

    res.json({ success: true, data: { unreadCount: total } });
  } catch (err) {
    next(err);
  }
});
