import type { Metadata } from 'next';
import { Providers } from '@/lib/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';
import { JsonLd } from '@/components/seo/json-ld';
import { organizationJsonLd, webSiteJsonLd } from '@/lib/json-ld';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ZUZZ — המקום שבו עסקאות זזות באמת',
    template: '%s | ZUZZ',
  },
  description: 'פלטפורמת המסחר המובילה בישראל. רכב, נדל"ן ושוק — עם תשתית אמון מובנית.',
  keywords: [
    'לוח מודעות',
    'רכב למכירה',
    'דירות למכירה',
    'יד שנייה',
    'רכב',
    'נדלן',
    'שוק',
    'ישראל',
    'ZUZZ',
    'מכוניות למכירה',
    'רכב יד שנייה',
    'לוח רכב',
  ],
  icons: {
    icon: '/brand/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'ZUZZ — המקום שבו עסקאות זזות באמת',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="flex min-h-screen flex-col font-sans">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={webSiteJsonLd()} />
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
