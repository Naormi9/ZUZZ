import { createEmailProvider, type EmailProvider } from '@zuzz/email';
import { createLogger } from '@zuzz/logger';

const logger = createLogger('api:email');

let _email: EmailProvider | null = null;

/**
 * Returns the configured email provider singleton.
 *
 * In production, uses SMTP (via SMTP_HOST, SMTP_PORT, etc.).
 * If SMTP_HOST is not set, falls back to mock provider (logs to console).
 */
export function getEmail(): EmailProvider {
  if (_email) return _email;

  const hasSmtpConfig = process.env.SMTP_HOST;

  if (hasSmtpConfig) {
    logger.info(
      { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT },
      'Initializing SMTP email provider',
    );
    _email = createEmailProvider({
      provider: 'smtp',
      from: process.env.SMTP_FROM || 'noreply@zuzz.co.il',
      fromName: 'ZUZZ',
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    });
  } else {
    logger.info('Initializing mock email provider (no SMTP_HOST configured)');
    _email = createEmailProvider({
      provider: 'mock',
      from: 'noreply@zuzz.co.il',
      fromName: 'ZUZZ',
    });
  }

  return _email;
}
