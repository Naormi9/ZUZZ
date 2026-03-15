'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Eye, TrendingDown, Trash2 } from 'lucide-react';

interface WatchItem {
  id: string;
  listingId: string;
  priceAtWatch: number;
  currentPrice: number;
  priceDrop: number;
  priceDropPercent: number;
  listing: {
    id: string;
    title: string;
    priceAmount: number;
    priceCurrency: string;
    status: string;
    media: { url: string; thumbnailUrl?: string }[];
  };
}

export default function WatchesPage() {
  const { isAuthenticated } = useAuth();
  const [watches, setWatches] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: WatchItem[] }>('/api/listing-watches');
        setWatches(res.data);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  async function unwatch(listingId: string) {
    try {
      await api.delete(`/api/listing-watches/${listingId}`);
      setWatches((prev) => prev.filter((w) => w.listingId !== listingId));
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-brand-black tracking-tight mb-6">מעקב מחירים</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : watches.length > 0 ? (
        <div className="space-y-3">
          {watches.map((watch) => (
            <Card key={watch.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <Link href={`/cars/${watch.listingId}`} className="flex-shrink-0">
                    <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden">
                      {watch.listing.media[0] && (
                        <img
                          src={watch.listing.media[0].thumbnailUrl || watch.listing.media[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/cars/${watch.listingId}`}>
                      <p className="text-sm font-semibold text-brand-black truncate hover:underline">
                        {watch.listing.title}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-brand-black">
                        ₪{watch.currentPrice.toLocaleString()}
                      </span>
                      {watch.priceDrop > 0 && (
                        <Badge className="bg-emerald-50 text-emerald-700 text-xs gap-0.5">
                          <TrendingDown className="h-3 w-3" />
                          -{watch.priceDropPercent}%
                        </Badge>
                      )}
                      {watch.priceDrop > 0 && (
                        <span className="text-xs text-gray-400 line-through">
                          ₪{watch.priceAtWatch.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    onClick={() => unwatch(watch.listingId)}
                    title="הסר מעקב"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Eye className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-brand-black mb-2">אין מודעות במעקב</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            לחץ על כפתור &quot;עקוב אחרי מחיר&quot; במודעה כדי לקבל התראות על ירידות מחיר.
          </p>
          <Link href="/cars/search">
            <Button>חפש רכבים</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
