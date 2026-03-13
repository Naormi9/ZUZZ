import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { listingsRouter } from './routes/listings';
import { carsRouter } from './routes/cars';
import { homesRouter } from './routes/homes';
import { marketRouter } from './routes/market';
import { searchRouter } from './routes/search';
import { favoritesRouter } from './routes/favorites';
import { messagesRouter } from './routes/messages';
import { leadsRouter } from './routes/leads';
import { notificationsRouter } from './routes/notifications';
import { adminRouter } from './routes/admin';
import { analyticsRouter } from './routes/analytics';
import { uploadRouter } from './routes/upload';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/error-handler';
import { setupWebSocket } from './websocket';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001',
    ],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/cars', carsRouter);
app.use('/api/homes', homesRouter);
app.use('/api/market', marketRouter);
app.use('/api/search', searchRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/upload', uploadRouter);

// Error handling
app.use(errorHandler);

// WebSocket
setupWebSocket(io);

const PORT = process.env.API_PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 ZUZZ API running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${PORT}`);
});

export { app, io };
