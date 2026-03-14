import type { EmailTemplate } from '../types';

export interface NotificationEmailData {
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  userName?: string;
}

export const notificationTemplate: EmailTemplate<NotificationEmailData> = {
  subject(data) {
    return data.title;
  },

  html(data) {
    const greeting = data.userName ? `שלום ${data.userName},` : 'שלום,';
    const ctaBlock =
      data.ctaText && data.ctaUrl
        ? `<div style="text-align: center; margin: 24px 0;">
            <a href="${data.ctaUrl}" style="display: inline-block; background: #FC6E20; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
              ${data.ctaText}
            </a>
           </div>`
        : '';

    return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8" /></head>
<body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #f9f9f9;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
    <h2 style="color: #1a1a1a; margin-bottom: 16px;">${data.title}</h2>
    <p style="color: #333; font-size: 16px;">${greeting}</p>
    <div style="color: #333; font-size: 15px; line-height: 1.6;">${data.body}</div>
    ${ctaBlock}
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #999; font-size: 12px;">ZUZZ — המקום שבו עסקאות זזות באמת</p>
  </div>
</body>
</html>`.trim();
  },

  text(data) {
    const greeting = data.userName ? `שלום ${data.userName},` : 'שלום,';
    const lines = [greeting, '', data.body];
    if (data.ctaText && data.ctaUrl) {
      lines.push('', `${data.ctaText}: ${data.ctaUrl}`);
    }
    lines.push('', 'ZUZZ — המקום שבו עסקאות זזות באמת');
    return lines.join('\n');
  },
};
