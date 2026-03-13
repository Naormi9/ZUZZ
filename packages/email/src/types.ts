export interface EmailConfig {
  provider: 'smtp' | 'mock';
  /** Default "from" address */
  from: string;
  /** Default "from" name */
  fromName?: string;
  /** SMTP host */
  host?: string;
  /** SMTP port */
  port?: number;
  /** Use TLS */
  secure?: boolean;
  /** SMTP auth user */
  user?: string;
  /** SMTP auth password */
  pass?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export interface EmailTemplate<TData = Record<string, unknown>> {
  subject(data: TData): string;
  html(data: TData): string;
  text(data: TData): string;
}
