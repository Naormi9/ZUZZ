'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Search, Bell, BellOff, Trash2, ExternalLink } from 'lucide-react';

interface SavedSearchItem {
  id: string;
  vertical: string;
  name: string | null;
  filters: Record<string, unknown>;
  alertEnabled: boolean;
  alertFrequency: string | null;
  createdAt: string;
}

function buildSearchUrl(vertical: string, filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  return `/${vertical}/search?${params.toString()}`;
}

function describeFilters(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  if (filters.make) parts.push(String(filters.make));
  if (filters.model) parts.push(String(filters.model));
  if (filters.yearFrom || filters.yearTo) {
    parts.push(`${filters.yearFrom || '?'}-${filters.yearTo || '?'}`);
  }
  if (filters.priceFrom || filters.priceTo) {
    parts.push(`₪${filters.priceFrom || '0'}-₪${filters.priceTo || '∞'}`);
  }
  if (filters.fuelType) {
    const labels: Record<string, string> = { petrol: 'בנזין', diesel: 'דיזל', hybrid: 'היברידי', electric: 'חשמלי' };
    parts.push(labels[String(filters.fuelType)] || String(filters.fuelType));
  }
  if (filters.verifiedSeller === 'true' || filters.verifiedSeller === true) parts.push('מוכר מאומת');
  return parts.length > 0 ? parts.join(' · ') : 'כל התוצאות';
}

export default function SavedSearchesPage() {
  const { isAuthenticated } = useAuth();
  const [searches, setSearches] = useState<SavedSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: SavedSearchItem[] }>('/api/saved-searches');
        setSearches(res.data);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  async function toggleAlert(id: string, current: boolean) {
    try {
      await api.patch(`/api/saved-searches/${id}`, { alertEnabled: !current });
      setSearches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, alertEnabled: !current } : s)),
      );
    } catch {
      // fail silently
    }
  }

  async function deleteSearch(id: string) {
    try {
      await api.delete(`/api/saved-searches/${id}`);
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // fail silently
    }
  }

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

  const FREQ_LABELS: Record<string, string> = {
    instant: 'מיידי',
    daily: 'יומי',
    weekly: 'שבועי',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">חיפושים שמורים</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : searches.length > 0 ? (
        <div className="space-y-3">
          {searches.map((search) => (
            <Card key={search.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-brand-black truncate">
                        {search.name || describeFilters(search.filters)}
                      </h3>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {search.vertical === 'cars' ? 'רכב' : search.vertical === 'homes' ? 'נדל"ן' : 'שוק'}
                      </Badge>
                    </div>
                    {search.name && (
                      <p className="text-sm text-gray-500 truncate">
                        {describeFilters(search.filters)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {search.alertEnabled && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <Bell className="h-3 w-3" />
                          התראות {FREQ_LABELS[search.alertFrequency || 'daily'] || 'יומי'}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(search.createdAt).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link href={buildSearchUrl(search.vertical, search.filters)}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleAlert(search.id, search.alertEnabled)}
                      title={search.alertEnabled ? 'כבה התראות' : 'הפעל התראות'}
                    >
                      {search.alertEnabled ? (
                        <Bell className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <BellOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                      onClick={() => deleteSearch(search.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-brand-black mb-2">אין חיפושים שמורים</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            שמור חיפושים מדף החיפוש וקבל התראות כשיש תוצאות חדשות.
          </p>
          <Link href="/cars/search">
            <Button>חפש רכבים</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
