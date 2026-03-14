import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbJsonLd } from '@/lib/json-ld';

export const metadata: Metadata = buildMetadata({
  title: 'מדריך קניית רכב — כל מה שצריך לדעת | ZUZZ',
  description:
    'מדריך מקיף לקניית רכב בישראל. בדיקות, מסמכים, משא ומתן, העברת בעלות ועוד — כל מה שחשוב לדעת לפני שקונים רכב.',
  path: '/guides/buying-car',
  ogType: 'article',
});

export default function BuyingCarGuidePage() {
  return (
    <div className="min-h-screen bg-white">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'ראשי', href: '/' },
          { name: 'רכב', href: '/cars' },
          { name: 'מדריך קניית רכב', href: '/guides/buying-car' },
        ])}
      />

      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="text-sm text-gray-500 mb-6">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-gray-700">ראשי</Link></li>
            <li><span className="mx-1 text-gray-300">/</span></li>
            <li><Link href="/cars" className="hover:text-gray-700">רכב</Link></li>
            <li><span className="mx-1 text-gray-300">/</span></li>
            <li className="text-gray-700 font-medium">מדריך קניית רכב</li>
          </ol>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
          מדריך קניית רכב בישראל
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          קניית רכב היא אחת ההחלטות הכלכליות הגדולות שנעשות. המדריך הזה יעזור
          לכם לנווט את התהליך בביטחון — מהחיפוש ועד העברת הבעלות.
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">1. הגדירו תקציב ריאלי</h2>
            <p className="text-gray-700 leading-relaxed">
              מעבר למחיר הרכב עצמו, קחו בחשבון עלויות נוספות: ביטוח, טסט שנתי,
              אגרת רישוי, תחזוקה שוטפת ודלק. מומלץ לשמור מרווח של 10-15% מעל
              מחיר הרכב לכיסוי הוצאות נלוות.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">2. חקרו את הרכב לפני הפגישה</h2>
            <p className="text-gray-700 leading-relaxed">
              בדקו את מחיר השוק של הרכב, קראו ביקורות, ובדקו היסטוריית תקלות
              נפוצות לדגם. ב-ZUZZ תוכלו לראות ציון אמון לכל מודעה שמבוסס על
              מסמכים אמיתיים ואימות מוכר.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">3. בדקו את המסמכים</h2>
            <p className="text-gray-700 leading-relaxed">
              וודאו שיש רישיון רכב תקף, טסט עדכני, וביטוח בתוקף. בדקו שאין
              עיקולים או שעבודים על הרכב. ב-ZUZZ מוכרים יכולים להעלות מסמכים
              מאומתים ישירות למודעה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">4. בדיקת רכב מקצועית</h2>
            <p className="text-gray-700 leading-relaxed">
              תמיד קחו את הרכב לבדיקה מקצועית במכון בדיקה מוסמך. הבדיקה כוללת
              מצב המנוע, השלדה, מערכת ההיגוי, הבלמים, מצב הצמיגים ועוד.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">5. משא ומתן ועסקה</h2>
            <p className="text-gray-700 leading-relaxed">
              אל תתביישו לנהל משא ומתן על המחיר. השתמשו במידע שאספתם כדי
              לתמוך בעמדתכם. ודאו שההעברה נעשית כחוק ברשות הרישוי.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-brand-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">מוכנים לחפש?</h3>
          <p className="text-gray-600 mb-4">
            מצאו את הרכב הבא שלכם ב-ZUZZ — עם ציון אמון ומוכרים מזוהים.
          </p>
          <Link
            href="/cars/search"
            className="inline-block rounded-lg bg-brand-500 px-8 py-3 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            חפש רכבים
          </Link>
        </div>

        {/* Related links */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/guides/selling-car" className="text-sm text-brand-600 hover:underline">
            מדריך מכירת רכב
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
