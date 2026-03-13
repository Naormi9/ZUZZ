import { Server } from 'socket.io';
import { verifyToken } from './middleware/auth';

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
    }

    socket.on('join:conversation', (conversationId: string) => {
      if (user) {
        socket.join(`conversation:${conversationId}`);
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
      // Cleanup handled automatically
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
