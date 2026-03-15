import { z } from 'zod';
import { israeliPhoneSchema } from './common';

export const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
});

export const registerSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').max(100),
  phone: israeliPhoneSchema.optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'קוד חייב להכיל 6 ספרות'),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z
    .object({
      city: z.string().optional(),
      region: z.string().optional(),
    })
    .optional(),
  website: z.string().url().optional().or(z.literal('')),
});
