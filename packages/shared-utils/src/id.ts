import { randomBytes } from 'crypto';

/** Generate a prefixed unique ID */
export function generateId(prefix?: string): string {
  const id = randomBytes(12).toString('hex');
  return prefix ? `${prefix}_${id}` : id;
}

/** Generate a short numeric OTP code */
export function generateOtp(length = 6): string {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  return String(Math.floor(Math.random() * (max - min) + min));
}

/** Generate invoice number */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}-${random}`;
}
