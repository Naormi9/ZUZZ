import { Server } from 'socket.io';
import { prisma } from '@zuzz/database';
import { createLogger } from '@zuzz/logger';
import { verifyToken } from './middleware/auth';

const logger = createLogger('api:websocket');

export function setupWebSocket(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const user = verifyToken(token);
        (socket as any).user = user;
      } catch {
        // Allow unauthenticated connections for public features
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    if (user) {
      socket.join(`user:${user.id}`);
      logger.debug({ userId: user.id }, 'User connected to WebSocket');
    }

    socket.on('join:conversation', async (conversationId: string) => {
      if (!user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Verify the user is a participant in this conversation
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { buyerId: true, listing: { select: { userId: true } } },
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const isBuyer = conversation.buyerId === user.id;
        const isSeller = conversation.listing.userId === user.id;

        if (!isBuyer && !isSeller) {
          socket.emit('error', { message: 'Access denied' });
          logger.warn({ userId: user.id, conversationId }, 'Unauthorized conversation join attempt');
          return;
        }

        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        logger.error({ err, conversationId }, 'Error verifying conversation membership');
        socket.emit('error', { message: 'Internal error' });
      }
    });

    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', (data: { conversationId: string }) => {
      if (user) {
        socket.to(`conversation:${data.conversationId}`).emit('typing', {
          userId: user.id,
          conversationId: data.conversationId,
        });
      }
    });

    socket.on('disconnect', () => {
      if (user) {
        logger.debug({ userId: user.id }, 'User disconnected from WebSocket');
      }
    });
  });

  return io;
}

export function emitToUser(io: Server, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToConversation(io: Server, conversationId: string, event: string, data: any) {
  io.to(`conversation:${conversationId}`).emit(event, data);
}
