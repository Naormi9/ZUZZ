import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'פרסם מודעת רכב | ZUZZ',
  robots: { index: false, follow: false },
};

export default function CarsCreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
