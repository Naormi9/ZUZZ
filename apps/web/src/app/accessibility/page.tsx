import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'הצהרת נגישות | ZUZZ',
  description: 'הצהרת הנגישות של פלטפורמת ZUZZ — מחויבים לנגישות לכולם.',
  path: '/accessibility',
});

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">הצהרת נגישות</h1>
        <div className="text-gray-700 leading-relaxed space-y-4">
          <p>
            ZUZZ מחויבת להנגשת הפלטפורמה לכלל האוכלוסייה בישראל, כולל אנשים
            עם מוגבלויות, בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות.
          </p>
          <p>
            אנו עובדים באופן שוטף על שיפור הנגישות. האתר תומך בקוראי מסך,
            ניווט מקלדת, ותצוגת RTL מלאה.
          </p>
          <p>
            נתקלתם בבעיית נגישות? פנו אלינו: support@zuzz.co.il
          </p>
        </div>
      </article>
    </div>
  );
}
