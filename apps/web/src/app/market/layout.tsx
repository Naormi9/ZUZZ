import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'שוק — קנה ומכור הכל | ZUZZ Market',
  description:
    'קנה ומכור כל דבר ב-ZUZZ Market. אלקטרוניקה, ריהוט, אופנה ועוד — עם אמון מובנה ומוכרים מזוהים.',
  path: '/market',
});

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return children;
}
