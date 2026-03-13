'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@zuzz/ui';
import { Skeleton } from '@zuzz/ui';
import { adminApi, type DashboardMetrics } from '@/lib/api';

const metricCards = [
  { key: 'totalUsers' as const, label: 'סה"כ משתמשים', icon: '👥', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'activeListings' as const, label: 'מודעות פעילות', icon: '📋', color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'pendingModeration' as const, label: 'ממתין למודרציה', icon: '⏳', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { key: 'openReports' as const, label: 'דיווחים פתוחים', icon: '🚩', color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'newUsersToday' as const, label: 'משתמשים חדשים היום', icon: '🆕', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'newListingsToday' as const, label: 'מודעות חדשות היום', icon: '📝', color: 'text-teal-600', bg: 'bg-teal-50' },
  { key: 'messagesToday' as const, label: 'הודעות היום', icon: '💬', color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'revenueThisMonth' as const, label: 'הכנסות החודש', icon: '💰', color: 'text-emerald-600', bg: 'bg-emerald-50' },
] as const;

const quickActions = [
  { label: 'ניהול משתמשים', href: '/admin/users', description: 'צפייה ועריכת משתמשים' },
  { label: 'תור מודרציה', href: '/admin/moderation', description: 'אישור ודחיית מודעות' },
  { label: 'דיווחים', href: '/admin/reports', description: 'טיפול בדיווחי משתמשים' },
  { label: 'ארגונים', href: '/admin/organizations', description: 'ניהול ארגונים וסוכנויות' },
  { label: 'Feature Flags', href: '/admin/feature-flags', description: 'ניהול דגלי פיצ\'רים' },
  { label: 'יומן פעולות', href: '/admin/audit-logs', description: 'צפייה בלוג פעולות' },
];

function formatNumber(num: number): string {
  return new Intl.NumberFormat('he-IL').format(num);
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getDashboardMetrics()
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">דשבורד</h1>
        <p className="mt-1 text-gray-500">סקירה כללית של הפלטפורמה</p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          שגיאה בטעינת נתונים: {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.label}</p>
                    <p className={`mt-2 text-2xl font-bold ${card.color}`}>
                      {metrics
                        ? card.key === 'revenueThisMonth'
                          ? formatCurrency(metrics[card.key])
                          : formatNumber(metrics[card.key])
                        : '—'}
                    </p>
                  </div>
                  <div className={`rounded-lg ${card.bg} p-3 text-2xl`}>
                    {card.icon}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">פעולות מהירות</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900">{action.label}</h3>
                  <p className="mt-1 text-sm text-gray-500">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
