import type { EmailTemplate } from '../types';

export interface WelcomeEmailData {
  userName: string;
  loginUrl?: string;
}

export const welcomeTemplate: EmailTemplate<WelcomeEmailData> = {
  subject(_data) {
    return 'ברוכים הבאים ל-ZUZZ!';
  },

  html(data) {
    const loginUrl = data.loginUrl ?? 'https://zuzz.co.il';
    return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8" /></head>
<body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #f9f9f9;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
    <h2 style="color: #1a1a1a; margin-bottom: 16px;">ברוכים הבאים ל-ZUZZ!</h2>
    <p style="color: #333; font-size: 16px;">שלום ${data.userName},</p>
    <p style="color: #333; font-size: 16px;">שמחים שהצטרפת! עם ZUZZ תוכל/י:</p>
    <ul style="color: #333; font-size: 15px; padding-right: 20px;">
      <li>לפרסם ולמצוא רכבים, דירות ומוצרים</li>
      <li>לבנות אמון עם קונים ומוכרים מאומתים</li>
      <li>לסגור עסקאות בצורה בטוחה ומהירה</li>
    </ul>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${loginUrl}" style="display: inline-block; background: #FC6E20; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        התחל/י עכשיו
      </a>
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #999; font-size: 12px;">ZUZZ — המקום שבו עסקאות זזות באמת</p>
  </div>
</body>
</html>`.trim();
  },

  text(data) {
    const loginUrl = data.loginUrl ?? 'https://zuzz.co.il';
    return [
      `שלום ${data.userName},`,
      '',
      'ברוכים הבאים ל-ZUZZ!',
      '',
      'שמחים שהצטרפת! עם ZUZZ תוכל/י:',
      '- לפרסם ולמצוא רכבים, דירות ומוצרים',
      '- לבנות אמון עם קונים ומוכרים מאומתים',
      '- לסגור עסקאות בצורה בטוחה ומהירה',
      '',
      `התחל/י עכשיו: ${loginUrl}`,
      '',
      'ZUZZ — המקום שבו עסקאות זזות באמת',
    ].join('\n');
  },
};
