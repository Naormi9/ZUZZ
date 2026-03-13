'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, ListingCard, Skeleton, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@zuzz/ui';
import { api } from '@/lib/api';

interface PropertyResult {
  id: string;
  title: string;
  price: { amount: number; currency: string };
  isNegotiable: boolean;
  media: { url: string; thumbnailUrl?: string }[];
  location: { city: string; neighborhood?: string };
  trustScore: number;
  isFeatured: boolean;
  property: {
    propertyType: string;
    rooms: number;
    sizeSqm: number;
    floor?: number;
    listingType: string;
  };
}

const PROPERTY_TYPES = [
  { label: 'דירה', value: 'apartment' },
  { label: 'בית פרטי', value: 'house' },
  { label: 'פנטהאוז', value: 'penthouse' },
  { label: 'דירת גן', value: 'garden_apartment' },
  { label: 'דופלקס', value: 'duplex' },
  { label: 'סטודיו', value: 'studio' },
  { label: 'וילה', value: 'villa' },
];

const ROOM_OPTIONS = [
  { label: '1-2 חדרים', value: '1-2' },
  { label: '3 חדרים', value: '3-3' },
  { label: '4 חדרים', value: '4-4' },
  { label: '5 חדרים', value: '5-5' },
  { label: '6+ חדרים', value: '6-99' },
];

const PRICE_RANGES = [
  { label: 'עד ₪1,000,000', value: '0-1000000' },
  { label: '₪1,000,000 - ₪2,000,000', value: '1000000-2000000' },
  { label: '₪2,000,000 - ₪3,500,000', value: '2000000-3500000' },
  { label: '₪3,500,000 - ₪5,000,000', value: '3500000-5000000' },
  { label: 'מעל ₪5,000,000', value: '5000000-999999999' },
];

export default function HomesPage() {
  const [featured, setFeatured] = useState<PropertyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState('');
  const [rooms, setRooms] = useState('');
  const [priceRange, setPriceRange] = useState('');

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await api.get<{ data: PropertyResult[] }>('/api/homes?featured=true&pageSize=6');
        setFeatured(res.data);
      } catch {
        // empty state
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    if (propertyType) params.set('propertyType', propertyType);
    if (rooms) {
      const [from, to] = rooms.split('-');
      params.set('roomsFrom', from ?? '');
      params.set('roomsTo', to ?? '');
    }
    if (priceRange) {
      const [from, to] = priceRange.split('-');
      params.set('priceFrom', from ?? '');
      params.set('priceTo', to ?? '');
    }
    window.location.href = `/homes/search?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-bl from-teal-700 via-teal-600 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">מצא את הבית הבא שלך</h1>
            <p className="text-lg text-teal-100 max-w-2xl mx-auto">
              נכסים עם בעלים מאומתים, מידע שקוף ותהליך עסקה ברור.
            </p>
          </div>

          {/* Quick Search */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סוג נכס</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="כל הסוגים" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">חדרים</label>
                <Select value={rooms} onValueChange={setRooms}>
                  <SelectTrigger>
                    <SelectValue placeholder="כל הגדלים" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">טווח מחירים</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="כל המחירים" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSearch} className="w-full sm:w-auto px-8">
              חיפוש נכסים
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">נכסים מומלצים</h2>
          <Link href="/homes/search" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
            הצג הכל
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-white overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((home) => (
              <ListingCard
                key={home.id}
                id={home.id}
                title={home.title}
                price={home.price.amount}
                currency={home.price.currency}
                isNegotiable={home.isNegotiable}
                imageUrl={home.media[0]?.thumbnailUrl || home.media[0]?.url}
                city={home.location.city}
                trustScore={home.trustScore}
                isFeatured={home.isFeatured}
                vertical="homes"
                details={[
                  { label: 'חדרים', value: String(home.property.rooms) },
                  { label: 'מ"ר', value: String(home.property.sizeSqm) },
                  ...(home.property.floor != null ? [{ label: 'קומה', value: String(home.property.floor) }] : []),
                ]}
                href={`/homes/${home.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">אין נכסים מומלצים כרגע</p>
            <Link href="/homes/search" className="text-teal-600 hover:underline mt-2 inline-block">
              חפש נכסים
            </Link>
          </div>
        )}
      </section>

      {/* Popular Cities */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ערים פופולריות</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'רמת גן', 'הרצליה', 'נתניה', 'ראשון לציון', 'פתח תקווה', 'אשדוד', 'רעננה', 'כפר סבא'].map((city) => (
            <Link
              key={city}
              href={`/homes/search?city=${encodeURIComponent(city)}`}
              className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-teal-300 hover:bg-teal-50 transition-colors"
            >
              {city}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-50 border-t border-teal-100">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">רוצה למכור או להשכיר נכס?</h2>
          <p className="text-gray-600 mb-6">פרסם מודעה ב-ZUZZ Homes עם אימות בעלות וחשיפה מקסימלית.</p>
          <Button onClick={() => (window.location.href = '/homes/create')} className="px-8">
            פרסם מודעת נכס
          </Button>
        </div>
      </section>
    </div>
  );
}
