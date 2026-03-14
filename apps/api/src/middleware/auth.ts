import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@zuzz/database';
import { AppError } from './error-handler';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be set and at least 32 characters in production');
    }
    return 'dev-secret-change-in-production-min32chars';
  }
  return secret;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, roles: user.roles },
    getJwtSecret(),
    { expiresIn: '7d' },
  );
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, getJwtSecret()) as AuthUser;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'לא מחובר');
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, roles: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'UNAUTHORIZED', 'חשבון לא פעיל');
    }

    req.user = { id: user.id, email: user.email, name: user.name, roles: user.roles };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError(401, 'UNAUTHORIZED', 'טוקן לא תקין'));
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const payload = verifyToken(token);
      // Verify user is still active in DB (prevents deactivated users from being recognized)
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true, roles: true, isActive: true },
      });
      if (user && user.isActive) {
        req.user = { id: user.id, email: user.email, name: user.name, roles: user.roles };
      }
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'לא מחובר'));
    }
    const hasRole = roles.some((role) => req.user!.roles.includes(role));
    if (!hasRole) {
      return next(new AppError(403, 'FORBIDDEN', 'אין הרשאה'));
    }
    next();
  };
}
