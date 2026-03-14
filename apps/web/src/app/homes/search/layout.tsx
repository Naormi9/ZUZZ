import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'חיפוש נדל"ן — דירות ובתים למכירה ולהשכרה | ZUZZ',
  description:
    'חיפוש דירות, בתים ונכסים למכירה ולהשכרה ב-ZUZZ. בעלים מאומתים, מידע שקוף וחיפוש מתקדם.',
  path: '/homes/search',
});

export default function HomesSearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
