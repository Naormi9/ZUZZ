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
        <div className="text-gray-700 leading-relaxed space-y-4">
          <p>
            ברוכים הבאים ל-ZUZZ. השימוש בפלטפורמה כפוף לתנאי שימוש אלה. בעצם
            השימוש באתר אתם מסכימים לתנאים המפורטים להלן.
          </p>
          <p>
            תנאי השימוש המלאים יפורסמו בקרוב. לשאלות ניתן לפנות
            אלינו בדוא&quot;ל: support@zuzz.co.il
          </p>
        </div>
      </article>
    </div>
  );
}
