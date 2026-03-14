import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbJsonLd } from '@/lib/json-ld';

export const metadata: Metadata = buildMetadata({
  title: 'מדריך מכירת רכב — איך למכור נכון ומהר | ZUZZ',
  description:
    'מדריך מקיף למכירת רכב בישראל. הכנת הרכב, צילום, תמחור, פרסום ועד סגירת העסקה — כל הטיפים למכירה מוצלחת.',
  path: '/guides/selling-car',
  ogType: 'article',
});

export default function SellingCarGuidePage() {
  return (
    <div className="min-h-screen bg-white">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'ראשי', href: '/' },
          { name: 'רכב', href: '/cars' },
          { name: 'מדריך מכירת רכב', href: '/guides/selling-car' },
        ])}
      />

      <article className="max-w-3xl mx-auto px-4 py-12">
        <nav aria-label="breadcrumb" className="text-sm text-gray-500 mb-6">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-gray-700">ראשי</Link></li>
            <li><span className="mx-1 text-gray-300">/</span></li>
            <li><Link href="/cars" className="hover:text-gray-700">רכב</Link></li>
            <li><span className="mx-1 text-gray-300">/</span></li>
            <li className="text-gray-700 font-medium">מדריך מכירת רכב</li>
          </ol>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
          מדריך מכירת רכב בישראל
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          רוצים למכור את הרכב בצורה מהירה ובמחיר הוגן? המדריך הזה יעזור לכם
          להכין מודעה מנצחת ולסגור עסקה טובה.
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. הכינו את הרכב למכירה</h2>
            <p className="text-gray-700 leading-relaxed">
              שטיפה חיצונית ופנימית, טיפול במצב הרכב, תיקון ליקויים קלים — כל
              אלה משפיעים על הרושם הראשון ועל המחיר שתקבלו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. תמחרו נכון</h2>
            <p className="text-gray-700 leading-relaxed">
              בדקו מחירי שוק לרכבים דומים. תמחור גבוה מדי ירחיק קונים, תמחור
              נמוך מדי יפגע ברווח. חפשו רכבים דומים ב-ZUZZ לקבלת התמונה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. צלמו תמונות איכותיות</h2>
            <p className="text-gray-700 leading-relaxed">
              תמונות טובות הן המפתח למודעה מצליחה. צלמו באור טבעי, מכל זווית,
              כולל פנים הרכב, תא המטען, ולוח השעונים.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. פרסמו מודעה מלאה ב-ZUZZ</h2>
            <p className="text-gray-700 leading-relaxed">
              מלאו את כל הפרטים, העלו מסמכים (רישיון רכב, טסט), ותנו תיאור
              כנה. מודעות מלאות מקבלות ציון אמון גבוה יותר ומושכות יותר קונים
              רציניים.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. סגרו עסקה בבטחון</h2>
            <p className="text-gray-700 leading-relaxed">
              היפגשו עם קונים במקומות ציבוריים, דרשו תשלום בנקאי, ובצעו העברת
              בעלות כחוק ברשות הרישוי.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-brand-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">מוכנים למכור?</h3>
          <p className="text-gray-600 mb-4">
            פרסמו מודעת רכב ב-ZUZZ תוך דקות וקבלו חשיפה לקונים רציניים.
          </p>
          <Link
            href="/cars/create"
            className="inline-block rounded-lg bg-brand-500 px-8 py-3 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            פרסם מודעת רכב
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/guides/buying-car" className="text-sm text-brand-600 hover:underline">
            מדריך קניית רכב
          </Link>
          <Link href="/trust" className="text-sm text-brand-600 hover:underline">
            בטיחות ואמון ב-ZUZZ
          </Link>
          <Link href="/cars" className="text-sm text-brand-600 hover:underline">
            דף הרכב הראשי
          </Link>
        </div>
      </article>
    </div>
  );
}
