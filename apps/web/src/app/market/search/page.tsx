'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ListingCard, Skeleton, Card, CardContent } from '@zuzz/ui';
import { api } from '@/lib/api';

interface MarketItem {
  id: string;
  title: string;
  price: { amount: number; currency: string };
  isNegotiable: boolean;
  media: { url: string; thumbnailUrl?: string }[];
  location: { city: string };
  trustScore: number;
  market?: { category: string; condition: string };
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'חדש',
  like_new: 'כמו חדש',
  good: 'מצב טוב',
  fair: 'סביר',
  for_parts: 'לחלקים',
};

export default function MarketSearchPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';

  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('vertical', 'market');
        if (category) params.set('category', category);
        if (q) params.set('q', q);
        params.set('pageSize', '20');

        const res = await api.get<{ data: { items: MarketItem[]; total: number } }>(
          `/api/search?${params.toString()}`,
        );
        setItems(res.data.items);
        setTotal(res.data.total);
      } catch {
        // Search failed — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category, q]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {category ? `חיפוש ב-${category}` : 'כל המודעות'}
            </h1>
            {!loading && (
              <p className="text-sm text-gray-500 mt-1">{total} תוצאות</p>
            )}
          </div>
          <Link
            href="/market"
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            חזרה לשוק
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <ListingCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price.amount}
                currency={item.price.currency}
                isNegotiable={item.isNegotiable}
                imageUrl={item.media[0]?.thumbnailUrl || item.media[0]?.url}
                city={item.location.city}
                trustScore={item.trustScore}
                vertical="market"
                details={
                  item.market?.condition
                    ? [{ label: 'מצב', value: CONDITION_LABELS[item.market.condition] || item.market.condition }]
                    : []
                }
                href={`/market/${item.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">לא נמצאו תוצאות</p>
            <Link
              href="/market"
              className="text-purple-600 hover:underline mt-2 inline-block"
            >
              חזרה לשוק
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
