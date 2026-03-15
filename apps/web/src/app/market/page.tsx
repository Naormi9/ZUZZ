'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, ListingCard, Skeleton, Card, CardContent } from '@zuzz/ui';
import { api } from '@/lib/api';

interface MarketItem {
  id: string;
  title: string;
  price: { amount: number; currency: string };
  isNegotiable: boolean;
  media: { url: string; thumbnailUrl?: string }[];
  location: { city: string };
  trustScore: number;
  category: string;
  condition: string;
}

const CATEGORIES = [
  { label: 'אלקטרוניקה', value: 'electronics', icon: '💻' },
  { label: 'ריהוט', value: 'furniture', icon: '🛋️' },
  { label: 'אופנה', value: 'fashion', icon: '👕' },
  { label: 'ספורט', value: 'sports', icon: '⚽' },
  { label: 'גינה', value: 'garden', icon: '🌱' },
  { label: 'ילדים', value: 'kids', icon: '🧸' },
  { label: 'חיות מחמד', value: 'pets', icon: '🐾' },
  { label: 'ספרים', value: 'books', icon: '📚' },
  { label: 'מוזיקה', value: 'music', icon: '🎵' },
  { label: 'אספנות', value: 'collectibles', icon: '💎' },
  { label: 'כלי עבודה', value: 'tools', icon: '🔧' },
  { label: 'אחר', value: 'other', icon: '📦' },
];

export default function MarketPage() {
  const router = useRouter();
  const [recentItems, setRecentItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await api.get<{ data: MarketItem[] }>('/api/market?pageSize=8&sort=newest');
        setRecentItems(res.data);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    loadRecent();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-bl from-purple-700 via-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">ZUZZ Market</h1>
            <p className="text-lg text-purple-100 max-w-2xl mx-auto">
              קנה ומכור כל דבר — עם אמון מובנה ומוכרים מזוהים.
            </p>
            <div className="mt-6">
              <Button onClick={() => router.push('/market/create')} className="px-8">
                פרסם מודעה חינם
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">קטגוריות</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={`/market/search?category=${cat.value}`}
              className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
            >
              <span className="text-2xl mb-2">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Listings */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">מודעות אחרונות</h2>
          <Link
            href="/market/search"
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            הצג הכל
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
        ) : recentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentItems.map((item) => (
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
                details={[{ label: 'מצב', value: getConditionLabel(item.condition) }]}
                href={`/market/${item.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">אין מודעות עדיין</p>
            <Link
              href="/market/create"
              className="text-purple-600 hover:underline mt-2 inline-block"
            >
              פרסם את המודעה הראשונה
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    new: 'חדש',
    like_new: 'כמו חדש',
    good: 'מצב טוב',
    fair: 'סביר',
    for_parts: 'לחלקים',
  };
  return labels[condition] || condition;
}
