import type { EmailTemplate } from '../types';

export interface OtpEmailData {
  code: string;
  expiresInMinutes: number;
  userName?: string;
}

export const otpTemplate: EmailTemplate<OtpEmailData> = {
  subject(_data) {
    return 'קוד אימות — ZUZZ';
  },

  html(data) {
    const greeting = data.userName ? `שלום ${data.userName},` : 'שלום,';
    return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8" /></head>
<body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #f9f9f9;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
    <h2 style="color: #1a1a1a; margin-bottom: 16px;">ZUZZ — אימות חשבון</h2>
    <p style="color: #333; font-size: 16px;">${greeting}</p>
    <p style="color: #333; font-size: 16px;">קוד האימות שלך הוא:</p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FC6E20; background: #FFF4EB; padding: 12px 24px; border-radius: 8px; display: inline-block;">
        ${data.code}
      </span>
    </div>
    <p style="color: #666; font-size: 14px;">הקוד תקף ל-${data.expiresInMinutes} דקות.</p>
    <p style="color: #666; font-size: 14px;">אם לא ביקשת קוד זה, ניתן להתעלם מהודעה זו.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #999; font-size: 12px;">ZUZZ — המקום שבו עסקאות זזות באמת</p>
  </div>
</body>
</html>`.trim();
  },

  text(data) {
    const greeting = data.userName ? `שלום ${data.userName},` : 'שלום,';
    return [
      greeting,
      '',
      `קוד האימות שלך הוא: ${data.code}`,
      `הקוד תקף ל-${data.expiresInMinutes} דקות.`,
      '',
      'אם לא ביקשת קוד זה, ניתן להתעלם מהודעה זו.',
      '',
      'ZUZZ — המקום שבו עסקאות זזות באמת',
    ].join('\n');
  },
};
