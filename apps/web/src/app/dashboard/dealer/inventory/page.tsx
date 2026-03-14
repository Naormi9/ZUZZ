'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Package, Plus, Eye, Heart, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  draft: 'טיוטה',
  active: 'פעילה',
  paused: 'מושהית',
  sold: 'נמכרה',
  archived: 'בארכיון',
  pending_review: 'ממתינה לאישור',
  rejected: 'נדחתה',
  expired: 'פגה תוקף',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

export default function DealerInventoryPage() {
  const { isAuthenticated } = useAuth();
  const [orgId, setOrgId] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadOrg() {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>('/api/organizations/my');
        if (res.data[0]) setOrgId(res.data[0].id);
      } catch {
        // ignore
      }
    }
    loadOrg();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!orgId) return;
    async function loadListings() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: '20' });
        if (statusFilter) params.set('status', statusFilter);
        const res = await api.get<{ success: boolean; data: { data: any[]; total: number } }>(
          `/api/organizations/${orgId}/listings?${params}`,
        );
        setListings(res.data.data);
        setTotal(res.data.total);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, [orgId, page, statusFilter]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול מלאי</h1>
          <p className="text-gray-500 text-sm">{total} מודעות סה&quot;כ</p>
        </div>
        <Link href="/cars/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            מודעה חדשה
          </Button>
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'active', 'draft', 'paused', 'sold', 'pending_review', 'rejected', 'archived'].map(
          (s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s ? STATUS_LABELS[s] || s : 'הכל'}
            </button>
          ),
        )}
      </div>

      {/* Listings table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="space-y-2">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="p-3 flex items-center gap-4">
                <div className="w-20 h-14 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                  {listing.media?.[0] && (
                    <img src={listing.media[0].url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {listing.title || 'ללא שם'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs ${STATUS_COLORS[listing.status] || 'bg-gray-100'}`}>
                      {STATUS_LABELS[listing.status] || listing.status}
                    </Badge>
                    {listing.isPromoted && (
                      <Badge className="text-xs bg-amber-100 text-amber-700">מקודם</Badge>
                    )}
                    {listing.priceAmount > 0 && (
                      <span className="text-xs text-gray-500">
                        ₪{listing.priceAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {listing.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {listing.favoriteCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {listing._count?.leads || 0}
                  </span>
                </div>
                <Link href={`/cars/${listing.id}`}>
                  <Button size="sm" variant="outline">
                    צפייה
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">אין מודעות</p>
          <Link href="/cars/create">
            <Button variant="outline" className="mt-4">
              פרסם מודעה ראשונה
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
