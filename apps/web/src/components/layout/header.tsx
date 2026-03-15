'use client';

import Link from 'next/link';
import { Search, Plus, User, Menu, X } from 'lucide-react';
import { Button } from '@zuzz/ui';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';

const navigation = [
  { label: 'רכב', href: '/cars' },
  { label: 'נדל"ן', href: '/homes' },
  { label: 'שוק', href: '/market' },
] as const;

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur safe-area-top supports-[backdrop-filter]:bg-white/80">
      <div className="container-app">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img
              src="/brand/logo-mark.svg"
              alt="ZUZZ"
              className="h-9 w-auto"
              onError={(e) => {
                // Fallback to text if logo not available
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="hidden text-2xl font-bold text-brand-black">ZUZZ</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Icon - Desktop */}
            <Link
              href="/cars/search"
              className="hidden rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:flex"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">חיפוש</span>
            </Link>

            {/* Publish CTA */}
            <Link href="/cars/create" className="hidden sm:block">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span>פרסם מודעה</span>
              </Button>
            </Link>

            {/* User Menu / Login */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">{user?.name ?? 'החשבון שלי'}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      לוח בקרה
                    </Link>
                    <Link
                      href="/dashboard/favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      מועדפים
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      הגדרות
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="block w-full px-4 py-2 text-start text-sm text-red-600 hover:bg-red-50"
                    >
                      התנתקות
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">התחברות</span>
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">תפריט</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 pb-4 md:hidden">
            <nav className="mt-2 flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/cars/search"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                חיפוש
              </Link>
              <div className="mt-2 px-4">
                <Link href="/cars/create" className="block">
                  <Button className="w-full gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span>פרסם מודעה</span>
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
