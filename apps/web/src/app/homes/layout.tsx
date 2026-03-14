import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'נדל"ן — דירות ובתים למכירה ולהשכרה | ZUZZ',
  description:
    'דירות, בתים ונכסים למכירה ולהשכרה ב-ZUZZ. בעלים מאומתים, מידע שקוף ותהליך עסקה ברור.',
  path: '/homes',
});

export default function HomesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
