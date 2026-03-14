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
        <div className="text-gray-700 leading-relaxed space-y-4">
          <p>
            ZUZZ מחויבת להגנה על פרטיותכם. מדיניות זו מתארת כיצד אנו אוספים,
            משתמשים ושומרים על המידע האישי שלכם.
          </p>
          <p>
            מדיניות הפרטיות המלאה תפורסם בקרוב. לשאלות ניתן לפנות
            אלינו בדוא&quot;ל: support@zuzz.co.il
          </p>
        </div>
      </article>
    </div>
  );
}
