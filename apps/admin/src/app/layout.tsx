import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import { AdminSidebar } from '@/components/admin-sidebar';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ZUZZ ניהול — לוח בקרה',
  description: 'לוח בקרה וניהול של פלטפורמת ZUZZ',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-sans">
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="ms-[260px] flex-1 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
