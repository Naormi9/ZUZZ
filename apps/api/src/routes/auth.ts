import { Router } from 'express';
import { prisma } from '@zuzz/database';
import { loginSchema, registerSchema, verifyOtpSchema } from '@zuzz/validation';
import { generateOtp } from '@zuzz/shared-utils';
import { createLogger } from '@zuzz/logger';
import { otpTemplate, welcomeTemplate } from '@zuzz/email';
import { signToken, authenticate } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { getEmail } from '../lib/email';

const logger = createLogger('api:auth');

export const authRouter = Router();

// Request login OTP
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'משתמש לא נמצא. יש להירשם תחילה.');
    }

    const code = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpCode.create({
      data: { userId: user.id, email, code, type: 'login', expiresAt },
    });

    // Send OTP email
    try {
      const emailProvider = getEmail();
      const templateData = { code, expiresInMinutes: 10, userName: user.name };
      await emailProvider.send({
        to: email,
        subject: otpTemplate.subject(templateData),
        html: otpTemplate.html(templateData),
        text: otpTemplate.text(templateData),
      });
      logger.info({ email }, 'OTP email sent');
    } catch (emailErr) {
      logger.error({ email, err: emailErr }, 'Failed to send OTP email');
      // In dev, log the code to console so dev can still work
      if (process.env.NODE_ENV !== 'production') {
        logger.debug({ email, code }, 'OTP code (email send failed, dev fallback)');
      }
    }

    res.json({ success: true, data: { message: 'קוד אימות נשלח לאימייל' } });
  } catch (err) {
    next(err);
  }
});

// Register new user
authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'כתובת אימייל כבר רשומה');
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        roles: ['user'],
        profile: {
          create: {
            displayName: data.name,
            verificationStatus: 'pending',
          },
        },
      },
    });

    const code = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: { userId: user.id, email: data.email, code, type: 'login', expiresAt },
    });

    // Send OTP + welcome email
    try {
      const emailProvider = getEmail();
      const templateData = { code, expiresInMinutes: 10, userName: data.name };
      await emailProvider.send({
        to: data.email,
        subject: otpTemplate.subject(templateData),
        html: otpTemplate.html(templateData),
        text: otpTemplate.text(templateData),
      });
      logger.info({ email: data.email }, 'Registration OTP email sent');
    } catch (emailErr) {
      logger.error({ email: data.email, err: emailErr }, 'Failed to send registration OTP email');
      if (process.env.NODE_ENV !== 'production') {
        logger.debug({ email: data.email, code }, 'OTP code (email send failed, dev fallback)');
      }
    }

    res.status(201).json({
      success: true,
      data: { message: 'חשבון נוצר. קוד אימות נשלח לאימייל.' },
    });
  } catch (err) {
    next(err);
  }
});

// Verify OTP and get token
authRouter.post('/verify', async (req, res, next) => {
  try {
    const { email, code } = verifyOtpSchema.parse(req.body);

    const otp = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      // Increment attempts on the latest OTP
      const latest = await prisma.otpCode.findFirst({
        where: { email, usedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (latest) {
        await prisma.otpCode.update({
          where: { id: latest.id },
          data: { attempts: { increment: 1 } },
        });
      }
      throw new AppError(400, 'INVALID_OTP', 'קוד אימות שגוי או פג תוקף');
    }

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'משתמש לא נמצא');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        lastLoginAt: new Date(),
      },
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get current user
authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        profile: true,
        organizationMembers: {
          include: { organization: true },
        },
      },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// Logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ success: true, data: { message: 'התנתקת בהצלחה' } });
});

// Dev-only: quick login (bypass OTP for development)
if (process.env.NODE_ENV !== 'production') {
  authRouter.post('/dev-login', async (req, res, next) => {
    try {
      const { email } = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'משתמש לא נמצא');
      }

      const token = signToken({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      });

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ success: true, data: { token, user } });
    } catch (err) {
      next(err);
    }
  });
}
