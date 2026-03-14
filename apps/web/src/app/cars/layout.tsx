import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'רכבים למכירה — לוח רכב עם ציון אמון | ZUZZ',
  description:
    'מצא את הרכב הבא שלך ב-ZUZZ. אלפי מודעות רכב עם ציון אמון, מסמכים מאומתים, מוכרים מזוהים וחיפוש מתקדם.',
  path: '/cars',
});

export default function CarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
