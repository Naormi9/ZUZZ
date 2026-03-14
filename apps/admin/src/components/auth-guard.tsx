'use client';

import { useEffect, useState } from 'react';
import { adminApi, ApiError } from '@/lib/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthorized'>('loading');

  useEffect(() => {
    adminApi
      .get<{ id: string; roles: string[] }>('/api/auth/me')
      .then((user) => {
        const roles = (user as any).roles ?? [];
        if (roles.includes('admin') || roles.includes('moderator')) {
          setStatus('authenticated');
        } else {
          setStatus('unauthorized');
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setStatus('unauthorized');
        } else {
          setStatus('unauthorized');
        }
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
          <p className="mt-3 text-sm text-gray-500">טוען...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">אין הרשאה</h1>
          <p className="mt-2 text-gray-600">אין לך הרשאת גישה ללוח הניהול.</p>
          <a
            href={process.env.NEXT_PUBLIC_APP_URL || '/'}
            className="mt-4 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            חזרה לאתר
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
