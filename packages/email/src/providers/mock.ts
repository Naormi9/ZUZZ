import type { EmailProvider } from '../index';
import type { SendEmailOptions, SendEmailResult } from '../types';

interface SentEmail {
  options: SendEmailOptions;
  sentAt: Date;
}

/**
 * Mock email provider that logs to console.
 * Useful for development and testing.
 */
export class MockEmailProvider implements EmailProvider {
  private sentEmails: SentEmail[] = [];

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const messageId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    this.sentEmails.push({ options, sentAt: new Date() });

    console.log('--- [MockEmailProvider] Email Sent ---');
    console.log(`  To:      ${recipients.join(', ')}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  ID:      ${messageId}`);
    if (options.text) {
      console.log(`  Text:    ${options.text.slice(0, 200)}...`);
    }
    console.log('--------------------------------------');

    return {
      messageId,
      accepted: recipients,
      rejected: [],
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }

  /** Get all emails sent through this mock (useful in tests) */
  getSentEmails(): readonly SentEmail[] {
    return this.sentEmails;
  }

  /** Clear sent email history */
  clear(): void {
    this.sentEmails = [];
  }
}
