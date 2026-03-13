'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Car, Heart, MessageCircle, Users, Plus, Eye, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({ listings: 0, favorites: 0, messages: 0, leads: 0 });
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const [listingsRes, favRes, msgRes, leadsRes] = await Promise.all([
          api.get<{ success: boolean; data: { data: any[]; total: number } }>('/api/listings/my/all?pageSize=5').catch(() => ({ data: { data: [], total: 0 } })),
          api.get<{ success: boolean; data: { total: number } }>('/api/favorites?pageSize=1').catch(() => ({ data: { total: 0 } })),
          api.get<{ success: boolean; data: { unreadCount: number } }>('/api/messages/unread-count').catch(() => ({ data: { unreadCount: 0 } })),
          api.get<{ success: boolean; data: any[] }>('/api/leads').catch(() => ({ data: [] })),
        ]);
        setStats({
          listings: listingsRes.data.total,
          favorites: favRes.data.total ?? 0,
          messages: msgRes.data.unreadCount ?? 0,
          leads: Array.isArray(leadsRes.data) ? leadsRes.data.length : 0,
        });
        setMyListings(listingsRes.data.data ?? []);
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
          <h1 className="text-2xl font-bold mb-4">יש להתחבר כדי לגשת ללוח הבקרה</h1>
          <Link href="/auth/login"><Button>התחברות</Button></Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'המודעות שלי', value: stats.listings, icon: Car, href: '/dashboard', color: 'text-blue-600 bg-blue-100' },
    { label: 'מועדפים', value: stats.favorites, icon: Heart, href: '/dashboard/favorites', color: 'text-red-600 bg-red-100' },
    { label: 'הודעות חדשות', value: stats.messages, icon: MessageCircle, href: '/dashboard/messages', color: 'text-green-600 bg-green-100' },
    { label: 'לידים', value: stats.leads, icon: Users, href: '/dashboard/leads', color: 'text-purple-600 bg-purple-100' },
  ];

  const STATUS_LABELS: Record<string, string> = {
    draft: 'טיוטה', active: 'פעילה', paused: 'מושהית', sold: 'נמכרה',
    archived: 'בארכיון', pending_review: 'ממתינה לאישור', rejected: 'נדחתה', expired: 'פגה תוקף',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">שלום, {user?.name}</h1>
          <p className="text-gray-500 text-sm mt-1">לוח הבקרה שלך</p>
        </div>
        <Link href="/cars/create">
          <Button className="gap-2"><Plus className="h-4 w-4" />פרסם מודעה</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  {loading ? <Skeleton className="h-7 w-12" /> : (
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  )}
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* My Listings */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">המודעות שלי</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : myListings.length > 0 ? (
            <div className="space-y-3">
              {myListings.map(listing => (
                <Link key={listing.id} href={listing.status === 'draft' ? `/cars/create` : `/cars/${listing.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border">
                    <div className="w-16 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                      {listing.media?.[0] && (
                        <img src={listing.media[0].url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{listing.title || 'טיוטה ללא שם'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {STATUS_LABELS[listing.status] || listing.status}
                        </Badge>
                        {listing.priceAmount > 0 && (
                          <span className="text-xs text-gray-500">₪{listing.priceAmount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{listing.viewCount}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{listing.favoriteCount}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Car className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium">אין מודעות עדיין</p>
              <p className="text-sm mt-1">פרסם את המודעה הראשונה שלך</p>
              <Link href="/cars/create">
                <Button variant="outline" className="mt-4">פרסם מודעה</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
