'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Button,
  ListingCard,
  Skeleton,
  EmptyState,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  Card,
  CardContent,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Badge,
} from '@zuzz/ui';
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
    condition: string;
  };
}

interface SearchApiResponse {
  success: boolean;
  data: {
    items: PropertyResult[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
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

const SORT_OPTIONS = [
  { label: 'מחיר: נמוך לגבוה', value: 'price_asc' },
  { label: 'מחיר: גבוה לנמוך', value: 'price_desc' },
  { label: 'חדש ביותר', value: 'newest' },
  { label: 'גודל: גדול לקטן', value: 'size_desc' },
];

export default function HomesSearchPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">טוען...</div>
        </div>
      }
    >
      <HomesSearchPage />
    </Suspense>
  );
}

function HomesSearchPage() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<PropertyResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');

  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [roomsFrom, setRoomsFrom] = useState(searchParams.get('roomsFrom') ?? '');
  const [roomsTo, setRoomsTo] = useState(searchParams.get('roomsTo') ?? '');
  const [priceFrom, setPriceFrom] = useState(searchParams.get('priceFrom') ?? '');
  const [priceTo, setPriceTo] = useState(searchParams.get('priceTo') ?? '');

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (propertyType) params.set('propertyType', propertyType);
    if (city) params.set('city', city);
    if (roomsFrom) params.set('roomsFrom', roomsFrom);
    if (roomsTo) params.set('roomsTo', roomsTo);
    if (priceFrom) params.set('priceFrom', priceFrom);
    if (priceTo) params.set('priceTo', priceTo);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('pageSize', '20');
    return params.toString();
  }, [propertyType, city, roomsFrom, roomsTo, priceFrom, priceTo, sort, page]);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        const query = buildQuery();
        const res = await api.get<SearchApiResponse>(`/api/homes/search?${query}`);
        setResults(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } catch {
        setResults([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [buildQuery]);

  function clearFilters() {
    setPropertyType('');
    setCity('');
    setRoomsFrom('');
    setRoomsTo('');
    setPriceFrom('');
    setPriceTo('');
    setPage(1);
  }

  const activeFilterCount = [propertyType, city, roomsFrom, priceTo].filter(Boolean).length;

  const filterContent = (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">סוג נכס</label>
        <Select
          value={propertyType}
          onValueChange={(v) => {
            setPropertyType(v);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="כל הסוגים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">כל הסוגים</SelectItem>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">עיר</label>
        <Input
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(1);
          }}
          placeholder="הקלד עיר..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">חדרים</label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={roomsFrom}
            onChange={(e) => {
              setRoomsFrom(e.target.value);
              setPage(1);
            }}
            placeholder="מ-"
          />
          <Input
            type="number"
            value={roomsTo}
            onChange={(e) => {
              setRoomsTo(e.target.value);
              setPage(1);
            }}
            placeholder="עד"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">טווח מחירים</label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={priceFrom}
            onChange={(e) => {
              setPriceFrom(e.target.value);
              setPage(1);
            }}
            placeholder="ממחיר"
          />
          <Input
            type="number"
            value={priceTo}
            onChange={(e) => {
              setPriceTo(e.target.value);
              setPage(1);
            }}
            placeholder="עד מחיר"
          />
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          נקה מסננים ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">חיפוש נכסים</h1>
              {!loading && (
                <p className="text-sm text-gray-500 mt-1">
                  {total > 0 ? `${total.toLocaleString('he-IL')} תוצאות` : 'אין תוצאות'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <Select
                  value={sort}
                  onValueChange={(v) => {
                    setSort(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="מיון" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Sheet>
                <SheetTrigger>
                  <Button variant="outline" className="lg:hidden">
                    סינון
                    {activeFilterCount > 0 && <Badge className="mr-1">{activeFilterCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>סינון נכסים</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">{filterContent}</div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card>
              <CardContent className="p-5">
                <h2 className="font-semibold text-gray-900 mb-4">סינון</h2>
                {filterContent}
              </CardContent>
            </Card>
          </aside>

          {/* Results + Map placeholder */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Map placeholder */}
            <div className="bg-gray-200 rounded-xl h-64 flex items-center justify-center border border-gray-300">
              <div className="text-center text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-sm font-medium">מפה תוצג כאן</p>
                <p className="text-xs text-gray-400">תצוגת מפה עם סימון נכסים</p>
              </div>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-6 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {results.map((home) => (
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
                        ...(home.property.floor != null
                          ? [{ label: 'קומה', value: String(home.property.floor) }]
                          : []),
                      ]}
                      href={`/homes/${home.id}`}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      הקודם
                    </Button>
                    <span className="text-sm text-gray-600">
                      עמוד {page} מתוך {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      הבא
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="לא נמצאו נכסים"
                description="נסה לשנות את הסינון או להרחיב את החיפוש"
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    נקה מסננים
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
