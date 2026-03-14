import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'צור קשר | ZUZZ',
  description: 'יצירת קשר עם צוות ZUZZ. שאלות, הצעות, דיווחים ותמיכה.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">צור קשר</h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          יש לכם שאלה, הצעה או דיווח? אנחנו כאן בשבילכם.
        </p>
        <div className="bg-gray-50 rounded-2xl p-8 space-y-4">
          <p className="text-gray-700">
            <strong>דוא&quot;ל:</strong>{' '}
            <a href="mailto:support@zuzz.co.il" className="text-brand-600 hover:underline">
              support@zuzz.co.il
            </a>
          </p>
          <p className="text-gray-700">
            <strong>שעות מענה:</strong> ימים א׳-ה׳, 09:00-18:00
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/about" className="text-sm text-brand-600 hover:underline">
            אודות ZUZZ
          </Link>
          <Link href="/trust" className="text-sm text-brand-600 hover:underline">
            בטיחות ואמון
          </Link>
        </div>
      </article>
    </div>
  );
}
