import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'חיפוש רכבים למכירה | ZUZZ',
  description:
    'חיפוש מתקדם של רכבים למכירה ב-ZUZZ. סנן לפי יצרן, דגם, שנה, מחיר ועוד — עם ציון אמון ומוכרים מזוהים.',
  path: '/cars/search',
});

export default function CarsSearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
