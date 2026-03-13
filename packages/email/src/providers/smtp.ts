import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { EmailProvider } from '../index';
import type { EmailConfig, SendEmailOptions, SendEmailResult } from '../types';

export class SmtpEmailProvider implements EmailProvider {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor(config: EmailConfig) {
    this.defaultFrom = config.fromName
      ? `"${config.fromName}" <${config.from}>`
      : config.from;

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port ?? 587,
      secure: config.secure ?? false,
      auth:
        config.user && config.pass
          ? { user: config.user, pass: config.pass }
          : undefined,
    });
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const from = options.fromName
      ? `"${options.fromName}" <${options.from ?? this.defaultFrom}>`
      : options.from ?? this.defaultFrom;

    const result = await this.transporter.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc
        ? Array.isArray(options.cc)
          ? options.cc.join(', ')
          : options.cc
        : undefined,
      bcc: options.bcc
        ? Array.isArray(options.bcc)
          ? options.bcc.join(', ')
          : options.bcc
        : undefined,
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    return {
      messageId: result.messageId,
      accepted: (result.accepted ?? []) as string[],
      rejected: (result.rejected ?? []) as string[],
    };
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
