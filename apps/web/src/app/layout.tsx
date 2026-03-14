import type { Metadata } from 'next';
import { Providers } from '@/lib/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZUZZ — המקום שבו עסקאות זזות באמת',
  description:
    'פלטפורמת המסחר המובילה בישראל. רכב, נדל"ן ושוק — עם תשתית אמון מובנית.',
  keywords: ['לוח מודעות', 'רכב', 'נדלן', 'שוק', 'ישראל', 'ZUZZ'],
  icons: {
    icon: '/brand/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="flex min-h-screen flex-col font-sans">
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
