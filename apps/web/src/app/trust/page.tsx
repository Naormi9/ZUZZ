import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'בטיחות ואמון — איך ZUZZ שומרת עליכם',
  description:
    'כך ZUZZ בונה אמון: ציון אמון מבוסס נתונים, אימות מוכרים, מסמכים מאומתים, הצהרות מוכר ומערכת דיווח.',
  path: '/trust',
});

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">בטיחות ואמון ב-ZUZZ</h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          ב-ZUZZ אמון הוא לא רק סיסמה — הוא תשתית מובנית בכל מודעה, כל מוכר וכל עסקה.
        </p>
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">ציון אמון</h2>
            <p className="text-gray-700 leading-relaxed">
              כל מודעה מקבלת ציון אמון (Trust Score) שמחושב לפי גורמים אמיתיים: אימות זהות המוכר,
              מסמכים שהועלו, שלמות המודעה, היסטוריית פעילות ועוד. ציון האמון לא מבוסס על ביקורות
              מזויפות אלא על נתונים אובייקטיביים.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">אימות מוכרים</h2>
            <p className="text-gray-700 leading-relaxed">
              מוכרים יכולים לעבור תהליך אימות שכולל אימות טלפון, אימות דוא&quot;ל ואימות זהות.
              מוכרים מאומתים מקבלים תג מיוחד שנראה בכל מודעה שלהם.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">מסמכים מאומתים</h2>
            <p className="text-gray-700 leading-relaxed">
              מוכרים יכולים להעלות מסמכים (רישיון רכב, טסט, ביטוח, דוח בדיקה) ישירות למודעה. מסמכים
              שעברו אימות מסומנים בתג מיוחד.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">הצהרות מוכר</h2>
            <p className="text-gray-700 leading-relaxed">
              כל מוכר רכב מתבקש להצהיר על מצב הרכב — תאונות, החלפת מנוע, נזקי שלדה ועוד. ההצהרות
              נראות בפרופיל המודעה ומסייעות בקבלת החלטה.
            </p>
          </section>
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link href="/cars/search" className="text-sm text-brand-600 hover:underline">
            חפש רכבים
          </Link>
          <Link href="/about" className="text-sm text-brand-600 hover:underline">
            אודות ZUZZ
          </Link>
        </div>
      </article>
    </div>
  );
}
