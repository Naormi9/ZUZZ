import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'תנאי שימוש | ZUZZ',
  description: 'תנאי השימוש של פלטפורמת ZUZZ.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">תנאי שימוש</h1>
        <p className="text-sm text-gray-500 mb-8">עדכון אחרון: מרץ 2026</p>
        <div className="text-gray-700 leading-relaxed space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. כללי</h2>
            <p>
              ברוכים הבאים ל-ZUZZ (&quot;הפלטפורמה&quot;, &quot;האתר&quot;, &quot;השירות&quot;).
              הפלטפורמה מופעלת על ידי ZUZZ (&quot;החברה&quot;, &quot;אנחנו&quot;). השימוש בפלטפורמה
              כפוף לתנאי שימוש אלה. בעצם השימוש באתר או ברישום לשירות, הנכם מסכימים לתנאים אלה
              במלואם.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. השירות</h2>
            <p>
              ZUZZ היא פלטפורמת מודעות ועסקאות מקוונת המתמחה ברכבים, נדל&quot;ן ומוצרים. הפלטפורמה
              מאפשרת למשתמשים לפרסם מודעות, לחפש, ליצור קשר עם מוכרים ולנהל עסקאות.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. הרשמה וחשבון משתמש</h2>
            <p>
              הרשמה לפלטפורמה דורשת כתובת אימייל תקינה. המשתמש אחראי לשמור על סודיות פרטי החשבון
              שלו. החברה שומרת לעצמה את הזכות להשעות או למחוק חשבונות שמפרים את תנאי השימוש.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. פרסום מודעות</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>המודעות חייבות להכיל מידע מדויק ועדכני.</li>
              <li>חל איסור לפרסם תכנים מטעים, הונאה, או מודעות לפריטים אסורים על פי חוק.</li>
              <li>החברה רשאית להסיר מודעות שאינן עומדות בכללי הפלטפורמה ללא התראה מוקדמת.</li>
              <li>אחריות על תוכן המודעה חלה על המפרסם בלבד.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. ציון אמון</h2>
            <p>
              ציון האמון של ZUZZ מבוסס על נתונים שהמשתמש מספק (מסמכים, אימותים, היסטוריית מודעות).
              הציון נועד לסייע לקונים בקבלת החלטות אך אינו מהווה אחריות של ZUZZ על המוכר או המוצר.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. תשלומים ומנויים</h2>
            <p>
              שירותים בסיסיים בפלטפורמה ניתנים ללא תשלום. שירותים מתקדמים (קידום מודעות, מנויי סוחר)
              כפופים למחירון העדכני. תנאי ביטול והחזרים יפורטו בעת הרכישה.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. הגבלת אחריות</h2>
            <p>
              ZUZZ משמשת כפלטפורמה בלבד ואינה צד לעסקאות בין משתמשים. החברה אינה אחראית לתוכן
              מודעות, למצב הפריטים, או לתוצאות עסקאות. מומלץ לבצע בדיקות עצמאיות לפני כל רכישה.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. קניין רוחני</h2>
            <p>
              כל הזכויות בפלטפורמה, לרבות העיצוב, הקוד, הלוגו והמותג שייכים ל-ZUZZ. חל איסור על
              העתקה, הפצה או שימוש מסחרי ללא אישור בכתב.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. שינויים בתנאי השימוש</h2>
            <p>
              החברה רשאית לעדכן תנאי שימוש אלה מעת לעת. שינויים מהותיים יפורסמו באתר. המשך השימוש
              בפלטפורמה לאחר עדכון מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. יצירת קשר</h2>
            <p>
              לשאלות בנוגע לתנאי השימוש ניתן לפנות אלינו בדוא&quot;ל:{' '}
              <a href="mailto:support@zuzz.co.il" className="text-brand-600 hover:underline">
                support@zuzz.co.il
              </a>
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
