import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/admin-sidebar';
import './globals.css';

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
    <html lang="he" dir="rtl">
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
