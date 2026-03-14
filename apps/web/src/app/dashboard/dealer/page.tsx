'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  Building2,
  Package,
  Users,
  TrendingUp,
  Eye,
  Heart,
  Megaphone,
  CreditCard,
  Settings,
} from 'lucide-react';

interface OrgData {
  id: string;
  name: string;
  type: string;
  verificationStatus: string;
  myRole: string;
  _count: { listings: number; members: number };
}

interface Analytics {
  activeListings: number;
  totalListings: number;
  totalLeads: number;
  newLeads: number;
  totalViews: number;
  totalFavorites: number;
  activePromotions: number;
}

export default function DealerDashboardPage() {
  const { isAuthenticated } = useAuth();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const orgsRes = await api.get<{ success: boolean; data: OrgData[] }>(
          '/api/organizations/my',
        );
        const myOrg = orgsRes.data[0];
        if (myOrg) {
          setOrg(myOrg);
          const analyticsRes = await api.get<{ success: boolean; data: Analytics }>(
            `/api/organizations/${myOrg.id}/analytics`,
          );
          setAnalytics(analyticsRes.data);
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">יש להתחבר</h1>
          <Link href="/auth/login">
            <Button>התחברות</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!loading && !org) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">אין לך חשבון עסקי</h1>
            <p className="text-gray-500 mb-6">פתח חשבון עסקי כדי לנהל מלאי, לידים וקידום מודעות.</p>
            <Link href="/dealer/onboarding">
              <Button>פתח חשבון עסקי</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending: { label: 'ממתין לאישור', color: 'bg-yellow-100 text-yellow-700' },
    verified: { label: 'מאושר', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'נדחה', color: 'bg-red-100 text-red-700' },
  };

  const statCards = analytics
    ? [
        {
          label: 'מודעות פעילות',
          value: analytics.activeListings,
          icon: Package,
          color: 'text-brand-500 bg-brand-100',
          href: '/dashboard/dealer/inventory',
        },
        {
          label: 'לידים חדשים',
          value: analytics.newLeads,
          icon: Users,
          color: 'text-purple-600 bg-purple-100',
          href: '/dashboard/dealer/leads',
        },
        {
          label: 'צפיות',
          value: analytics.totalViews,
          icon: Eye,
          color: 'text-blue-600 bg-blue-100',
          href: '/dashboard/dealer/inventory',
        },
        {
          label: 'מועדפים',
          value: analytics.totalFavorites,
          icon: Heart,
          color: 'text-red-600 bg-red-100',
          href: '/dashboard/dealer/inventory',
        },
        {
          label: 'קידומים פעילים',
          value: analytics.activePromotions,
          icon: Megaphone,
          color: 'text-amber-600 bg-amber-100',
          href: '/dashboard/dealer/promotions',
        },
        {
          label: 'סה"כ לידים',
          value: analytics.totalLeads,
          icon: TrendingUp,
          color: 'text-green-600 bg-green-100',
          href: '/dashboard/dealer/leads',
        },
      ]
    : [];

  const navLinks = [
    { label: 'ניהול מלאי', href: '/dashboard/dealer/inventory', icon: Package },
    { label: 'לידים', href: '/dashboard/dealer/leads', icon: Users },
    { label: 'קידום מודעות', href: '/dashboard/dealer/promotions', icon: Megaphone },
    { label: 'צוות', href: '/dashboard/dealer/team', icon: Users },
    { label: 'מנוי וחשבון', href: '/dashboard/dealer/billing', icon: CreditCard },
    { label: 'הגדרות', href: '/dashboard/dealer/settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          {loading ? (
            <Skeleton className="h-8 w-48 mb-2" />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{org?.name}</h1>
                <Badge
                  className={`text-xs ${STATUS_MAP[org?.verificationStatus || 'pending']?.color}`}
                >
                  {STATUS_MAP[org?.verificationStatus || 'pending']?.label}
                </Badge>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                פורטל סוחר · {org?.myRole === 'owner' ? 'בעלים' : org?.myRole}
              </p>
            </>
          )}
        </div>
        <Link href="/cars/create">
          <Button>פרסם מודעה</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : statCards.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}
                    >
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value.toLocaleString('he-IL')}
                      </p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:border-brand-300 hover:bg-brand-50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <link.icon className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-900">{link.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
