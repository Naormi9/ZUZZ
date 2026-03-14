'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Car, Building2, ShoppingBag, Plus } from 'lucide-react';
import { cn } from '@zuzz/ui';

const navItems = [
  { label: 'ראשי', href: '/', icon: Home },
  { label: 'רכב', href: '/cars', icon: Car },
  { label: 'פרסם', href: '/cars/create', icon: Plus, highlight: true },
  { label: 'נדל"ן', href: '/homes', icon: Building2 },
  { label: 'שוק', href: '/market', icon: ShoppingBag },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-50 border-t border-gray-200 bg-white sm:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const isHighlight = 'highlight' in item && item.highlight;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                isHighlight
                  ? 'text-brand-600'
                  : isActive
                    ? 'text-brand-600'
                    : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {isHighlight ? (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-md">
                  <Icon className="h-5 w-5" />
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className={cn(isHighlight && '-mt-0.5 font-medium')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
