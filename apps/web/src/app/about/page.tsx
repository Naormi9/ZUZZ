import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'אודות ZUZZ — הפלטפורמה שבה עסקאות זזות באמת',
  description:
    'ZUZZ היא פלטפורמת המסחר המובילה בישראל. רכב, נדל"ן ושוק — עם תשתית אמון מובנית, מוכרים מזוהים ומסמכים מאומתים.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">אודות ZUZZ</h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          ZUZZ היא לא עוד לוח מודעות. אנחנו פלטפורמת עסקאות עם תשתית אמון אמיתית — שנבנתה כדי שקנייה
          ומכירה בישראל יהיו בטוחות, שקופות ויעילות.
        </p>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            הפלטפורמה שלנו מתמקדת בשלוש קטגוריות מרכזיות:{' '}
            <Link href="/cars" className="text-brand-600 hover:underline font-medium">
              רכב
            </Link>
            ,{' '}
            <Link href="/homes" className="text-brand-600 hover:underline font-medium">
              נדל&quot;ן
            </Link>{' '}
            ו
            <Link href="/market" className="text-brand-600 hover:underline font-medium">
              שוק
            </Link>
            .
          </p>
          <p>
            כל מודעה ב-ZUZZ מקבלת ציון אמון מבוסס נתונים אמיתיים — אימות זהות מוכר, מסמכים מאומתים,
            היסטוריית מודעות ועוד. כך אתם יודעים מול מי אתם עומדים עוד לפני הפגישה הראשונה.
          </p>
          <p>
            ZUZZ נבנתה עם דגש על חוויית המשתמש: ממשק בעברית, תמיכה מלאה ב-RTL, חיפוש מתקדם, וכלים
            שעוזרים לסגור עסקאות — לא רק למצוא מודעות.
          </p>
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link href="/trust" className="text-sm text-brand-600 hover:underline">
            בטיחות ואמון
          </Link>
          <Link href="/cars" className="text-sm text-brand-600 hover:underline">
            לוח הרכב
          </Link>
          <Link href="/contact" className="text-sm text-brand-600 hover:underline">
            צור קשר
          </Link>
        </div>
      </article>
    </div>
  );
}
