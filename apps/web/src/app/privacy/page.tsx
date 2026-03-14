import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'מדיניות פרטיות | ZUZZ',
  description: 'מדיניות הפרטיות של פלטפורמת ZUZZ — כך אנחנו מגנים על המידע שלכם.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">מדיניות פרטיות</h1>
        <p className="text-sm text-gray-500 mb-8">עדכון אחרון: מרץ 2026</p>
        <div className="text-gray-700 leading-relaxed space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. כללי</h2>
            <p>
              ZUZZ (&quot;החברה&quot;, &quot;אנחנו&quot;) מחויבת להגנה על פרטיותכם. מדיניות זו מתארת
              כיצד אנו אוספים, משתמשים, שומרים ומגנים על המידע האישי שלכם בעת השימוש בפלטפורמת ZUZZ
              (&quot;הפלטפורמה&quot;, &quot;האתר&quot;, &quot;השירות&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. מידע שאנו אוספים</h2>
            <p className="mb-2">אנו אוספים את סוגי המידע הבאים:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>מידע שנמסר על ידכם:</strong> שם, כתובת אימייל, מספר טלפון (אם נמסר), תוכן
                מודעות, תמונות שהועלו, ומסמכים לצורך אימות זהות.
              </li>
              <li>
                <strong>מידע שנאסף אוטומטית:</strong> כתובת IP, סוג דפדפן, מערכת הפעלה, עמודים
                שנצפו, זמני גישה, ומזהי עוגיות.
              </li>
              <li>
                <strong>מידע מצדדים שלישיים:</strong> נתוני רכב ממאגרי מידע ציבוריים (לצורך אימות
                פרטי רכב), מידע מספקי תשלום.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. שימוש במידע</h2>
            <p className="mb-2">אנו משתמשים במידע שנאסף למטרות הבאות:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>הפעלת הפלטפורמה ומתן השירותים המבוקשים.</li>
              <li>אימות זהות משתמשים וחישוב ציון אמון.</li>
              <li>שיפור חוויית המשתמש והתאמה אישית של התוכן.</li>
              <li>תקשורת עמכם בנוגע לחשבונכם, מודעות, או עדכוני שירות.</li>
              <li>מניעת הונאות, שמירה על ביטחון הפלטפורמה ואכיפת תנאי השימוש.</li>
              <li>עמידה בדרישות חוק ורגולציה.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. שיתוף מידע</h2>
            <p className="mb-2">אנו לא מוכרים את המידע האישי שלכם. אנו עשויים לשתף מידע:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>עם משתמשים אחרים — מידע ציבורי שמופיע במודעות ובפרופיל המוכר.</li>
              <li>עם ספקי שירות — חברות עיבוד תשלומים, אחסון ענן, ושירותי אימייל הפועלים בשמנו.</li>
              <li>
                בהתאם לדרישת חוק — צווי בית משפט, דרישות רגולטוריות, או הגנה על זכויותינו החוקיות.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. אבטחת מידע</h2>
            <p>
              אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע שלכם, לרבות הצפנת נתונים בהעברה
              (HTTPS/TLS), אחסון מאובטח של סיסמאות ומפתחות, והגבלת גישה למידע לעובדים מורשים בלבד.
              עם זאת, אין אפשרות להבטיח אבטחה מוחלטת של מידע באינטרנט.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. עוגיות (Cookies)</h2>
            <p>
              הפלטפורמה משתמשת בעוגיות לצורך אימות, שמירת העדפות, וניתוח שימוש. ניתן לנהל את הגדרות
              העוגיות דרך הדפדפן. חסימת עוגיות עלולה להשפיע על תפקוד חלק מהשירותים.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. שמירת מידע</h2>
            <p>
              אנו שומרים את המידע האישי שלכם כל עוד חשבונכם פעיל או לפי הנדרש לצורך מתן השירותים.
              לאחר מחיקת חשבון, מידע אישי יימחק או יעבור אנונימיזציה תוך 90 יום, למעט מידע שנדרש
              לשמירה על פי חוק.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. זכויותיכם</h2>
            <p className="mb-2">בהתאם לחוק הגנת הפרטיות, עומדות לכם הזכויות הבאות:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>לעיין במידע האישי שלכם המוחזק אצלנו.</li>
              <li>לבקש תיקון מידע שגוי.</li>
              <li>לבקש מחיקת המידע שלכם (בכפוף להגבלות חוקיות).</li>
              <li>להתנגד לעיבוד מידע לצורכי שיווק ישיר.</li>
              <li>לבקש העברת המידע שלכם (ניידות מידע).</li>
            </ul>
            <p className="mt-2">
              לממוש זכויות אלה, פנו אלינו בדוא&quot;ל:{' '}
              <a href="mailto:privacy@zuzz.co.il" className="text-brand-600 hover:underline">
                privacy@zuzz.co.il
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. שינויים במדיניות</h2>
            <p>
              אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באתר ותישלח הודעה
              למשתמשים רשומים. המשך השימוש בפלטפורמה לאחר עדכון מהווה הסכמה למדיניות המעודכנת.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. יצירת קשר</h2>
            <p>לשאלות בנוגע למדיניות הפרטיות או לטיפול במידע האישי שלכם, ניתן לפנות אלינו:</p>
            <ul className="list-none space-y-1 mt-2">
              <li>
                דוא&quot;ל:{' '}
                <a href="mailto:privacy@zuzz.co.il" className="text-brand-600 hover:underline">
                  privacy@zuzz.co.il
                </a>
              </li>
              <li>
                דוא&quot;ל כללי:{' '}
                <a href="mailto:support@zuzz.co.il" className="text-brand-600 hover:underline">
                  support@zuzz.co.il
                </a>
              </li>
            </ul>
          </section>
        </div>
      </article>
    </div>
  );
}
