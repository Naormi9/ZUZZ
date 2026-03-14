export type {
  EmailConfig,
  SendEmailOptions,
  SendEmailResult,
  EmailAttachment,
  EmailTemplate,
} from './types';

export interface EmailProvider {
  /** Send an email */
  send(options: import('./types').SendEmailOptions): Promise<import('./types').SendEmailResult>;
  /** Verify the connection / credentials */
  verify(): Promise<boolean>;
}

export function createEmailProvider(config: import('./types').EmailConfig): EmailProvider {
  switch (config.provider) {
    case 'smtp': {
      const { SmtpEmailProvider } =
        require('./providers/smtp') as typeof import('./providers/smtp');
      return new SmtpEmailProvider(config);
    }
    case 'mock': {
      const { MockEmailProvider } =
        require('./providers/mock') as typeof import('./providers/mock');
      return new MockEmailProvider();
    }
    default:
      throw new Error(
        `Unknown email provider: ${(config as import('./types').EmailConfig).provider}`,
      );
  }
}

export { SmtpEmailProvider } from './providers/smtp';
export { MockEmailProvider } from './providers/mock';

// Templates
export { otpTemplate } from './templates/otp';
export type { OtpEmailData } from './templates/otp';
export { welcomeTemplate } from './templates/welcome';
export type { WelcomeEmailData } from './templates/welcome';
export { notificationTemplate } from './templates/notification';
export type { NotificationEmailData } from './templates/notification';
