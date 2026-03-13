'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Spinner } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/hooks/use-auth';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ listings: 0, favorites: 0, messages: 0, leads: 0 });
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [listingsRes, favRes, msgRes] = await Promise.allSettled([
          api.get<{ data: { total: number; data: any[] } }>('/api/listings/my/all'),
          api.get<{ data: { total: number } }>('/api/favorites'),
          api.get<{ data: { unreadCount: number } }>('/api/messages/unread-count'),
        ]);

        if (listingsRes.status === 'fulfilled') {
          setStats(prev => ({ ...prev, listings: listingsRes.value.data.total }));
          setMyListings(listingsRes.value.data.data.slice(0, 5));
        }
        if (favRes.status === 'fulfilled') setStats(prev => ({ ...prev, favorites: favRes.value.data.total }));
        if (msgRes.status === 'fulfilled') setStats(prev => ({ ...prev, messages: msgRes.value.data.unreadCount }));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">שלום, {user?.name || 'אורח'}</h1>
          <p className="text-gray-500">ברוכים הבאים ללוח הבקרה שלך</p>
        </div>
        <Button onClick={() => window.location.href = '/cars/create'}>+ פרסם מודעה</Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="מודעות שלי" value={stats.listings} href="/dashboard" />
        <StatCard title="מועדפים" value={stats.favorites} href="/dashboard/favorites" />
        <StatCard title="הודעות חדשות" value={stats.messages} href="/dashboard/messages" />
        <StatCard title="לידים" value={stats.leads} href="/dashboard/leads" />
      </div>

      {/* My Listings */}
      <Card>
        <CardHeader>
          <CardTitle>המודעות שלי</CardTitle>
        </CardHeader>
        <CardContent>
          {myListings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">עדיין לא פרסמת מודעות</p>
              <Button onClick={() => window.location.href = '/cars/create'}>פרסם מודעה ראשונה</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map((listing) => (
                <div key={listing.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-16 h-12 bg-gray-100 rounded flex-shrink-0">
                    {listing.media?.[0] && <img src={listing.media[0].url} alt="" className="w-full h-full object-cover rounded" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{listing.title || 'טיוטה'}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={listing.status === 'active' ? 'success' : listing.status === 'draft' ? 'secondary' : 'warning'}>
                        {listing.status === 'active' ? 'פעיל' : listing.status === 'draft' ? 'טיוטה' : listing.status}
                      </Badge>
                      {listing.priceAmount > 0 && <span className="text-sm text-gray-500">₪{listing.priceAmount.toLocaleString()}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => window.location.href = `/listings/${listing.id}`}>צפייה</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, href }: { title: string; value: number; href: string }) {
  return (
    <a href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{value}</div>
          <div className="text-sm text-gray-500 mt-1">{title}</div>
        </CardContent>
      </Card>
    </a>
  );
}
