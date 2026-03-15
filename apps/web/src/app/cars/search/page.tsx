'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Skeleton,
  Badge,
  ListingCard,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  EmptyState,
} from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { analytics } from '@/lib/analytics';
import { SlidersHorizontal, ChevronLeft, ChevronRight, X, Bell, Search } from 'lucide-react';

interface SearchApiResponse {
  success: boolean;
  data: {
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
    facets?: any;
  };
}

const MAKES = [
  'טויוטה',
  'יונדאי',
  'קיה',
  'מאזדה',
  'סקודה',
  'פולקסווגן',
  'BMW',
  'מרצדס',
  'אאודי',
  'ניסאן',
  'סוזוקי',
  'שברולט',
  'סובארו',
  'הונדה',
  'רנו',
  "פיג'ו",
  'סיטרואן',
  'פורד',
  'אופל',
  'מיצובישי',
];

const FUEL_TYPES = [
  { label: 'בנזין', value: 'petrol' },
  { label: 'דיזל', value: 'diesel' },
  { label: 'היברידי', value: 'hybrid' },
  { label: 'חשמלי', value: 'electric' },
  { label: 'גז', value: 'lpg' },
];

const GEARBOX_OPTIONS = [
  { label: 'אוטומט', value: 'automatic' },
  { label: 'ידני', value: 'manual' },
  { label: 'רובוטי', value: 'robotic' },
];

const SORT_OPTIONS = [
  { label: 'מחיר: נמוך לגבוה', value: 'price_asc' },
  { label: 'מחיר: גבוה לנמוך', value: 'price_desc' },
  { label: 'שנה: חדש', value: 'year_desc' },
  { label: 'ק"מ: נמוך', value: 'mileage_asc' },
  { label: 'אמון: גבוה', value: 'trust_desc' },
  { label: 'חדש ביותר', value: 'newest' },
];

const HAND_OPTIONS = [
  { label: 'יד ראשונה', value: '1' },
  { label: 'עד יד שנייה', value: '2' },
  { label: 'עד יד שלישית', value: '3' },
  { label: 'עד יד רביעית', value: '4' },
];

const currentYear = new Date().getFullYear();

export default function CarsSearchPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">טוען...</div>
        </div>
      }
    >
      <CarsSearchPage />
    </Suspense>
  );
}

function CarsSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter state
  const [make, setMake] = useState(searchParams.get('make') ?? '');
  const [model, setModel] = useState(searchParams.get('model') ?? '');
  const [yearFrom, setYearFrom] = useState(searchParams.get('yearFrom') ?? '');
  const [yearTo, setYearTo] = useState(searchParams.get('yearTo') ?? '');
  const [priceFrom, setPriceFrom] = useState(searchParams.get('priceFrom') ?? '');
  const [priceTo, setPriceTo] = useState(searchParams.get('priceTo') ?? '');
  const [fuelType, setFuelType] = useState(searchParams.get('fuelType') ?? '');
  const [gearbox, setGearbox] = useState(searchParams.get('gearbox') ?? '');
  const [maxMileage, setMaxMileage] = useState(searchParams.get('maxMileage') ?? '');
  const [maxHand, setMaxHand] = useState(searchParams.get('maxHand') ?? '');
  const [evOnly, setEvOnly] = useState(searchParams.get('evOnly') === 'true');
  const [verifiedSeller, setVerifiedSeller] = useState(
    searchParams.get('verifiedSeller') === 'true',
  );
  const [noAccidents, setNoAccidents] = useState(searchParams.get('noAccidents') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'));

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (make) params.set('make', make);
    if (model) params.set('model', model);
    if (yearFrom) params.set('yearFrom', yearFrom);
    if (yearTo) params.set('yearTo', yearTo);
    if (priceFrom) params.set('priceFrom', priceFrom);
    if (priceTo) params.set('priceTo', priceTo);
    if (fuelType) params.set('fuelType', fuelType);
    if (gearbox) params.set('gearbox', gearbox);
    if (maxMileage) params.set('maxMileage', maxMileage);
    if (maxHand) params.set('maxHand', maxHand);
    if (evOnly) params.set('evOnly', 'true');
    if (verifiedSeller) params.set('verifiedSeller', 'true');
    if (noAccidents) params.set('noAccidents', 'true');
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    params.set('pageSize', '20');
    return params.toString();
  }, [
    make,
    model,
    yearFrom,
    yearTo,
    priceFrom,
    priceTo,
    fuelType,
    gearbox,
    maxMileage,
    maxHand,
    evOnly,
    verifiedSeller,
    noAccidents,
    sort,
    page,
  ]);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        const query = buildQuery();
        const res = await api.get<SearchApiResponse>(`/api/cars/search?${query}`);
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

  function applyFilters() {
    setPage(1);
    setMobileFiltersOpen(false);
    const query = buildQuery();
    router.push(`/cars/search?${query}`);
  }

  function clearFilters() {
    setMake('');
    setModel('');
    setYearFrom('');
    setYearTo('');
    setPriceFrom('');
    setPriceTo('');
    setFuelType('');
    setGearbox('');
    setMaxMileage('');
    setMaxHand('');
    setEvOnly(false);
    setVerifiedSeller(false);
    setNoAccidents(false);
    setPage(1);
  }

  const activeFilterCount = [
    make,
    model,
    yearFrom,
    priceTo,
    fuelType,
    gearbox,
    maxMileage,
    maxHand,
    evOnly,
    verifiedSeller,
    noAccidents,
  ].filter(Boolean).length;

  // Dynamic title and noindex for search pages
  useEffect(() => {
    const parts: string[] = [];
    if (make) parts.push(make);
    if (model) parts.push(model);
    if (fuelType) {
      const fuelLabels: Record<string, string> = {
        petrol: 'בנזין',
        diesel: 'דיזל',
        hybrid: 'היברידי',
        electric: 'חשמלי',
        lpg: 'גז',
      };
      parts.push(fuelLabels[fuelType] ?? fuelType);
    }
    const suffix = parts.length > 0 ? ` — ${parts.join(' ')}` : '';
    document.title = `חיפוש רכבים${suffix} | ZUZZ`;

    // noindex for heavily filtered pages (3+ params) to prevent index bloat
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (activeFilterCount >= 3) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex,follow');
    } else if (metaRobots) {
      metaRobots.setAttribute('content', 'index,follow');
    }
  }, [make, model, fuelType, activeFilterCount]);

  const filterContent = (
    <div className="space-y-6">
      {/* Make */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">יצרן</label>
        <Select value={make} onValueChange={setMake}>
          <SelectTrigger>
            <SelectValue placeholder="כל היצרנים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">כל היצרנים</SelectItem>
            {MAKES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">דגם</label>
        <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="הקלד דגם..." />
      </div>

      {/* Year Range */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">שנתון</label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            placeholder="משנה"
            min={2000}
            max={currentYear}
          />
          <Input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            placeholder="עד שנה"
            min={2000}
            max={currentYear}
          />
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">טווח מחירים</label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            placeholder="ממחיר"
          />
          <Input
            type="number"
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            placeholder="עד מחיר"
          />
        </div>
      </div>

      {/* Fuel Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">סוג דלק</label>
        <Select value={fuelType} onValueChange={setFuelType}>
          <SelectTrigger>
            <SelectValue placeholder="כל הסוגים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">כל הסוגים</SelectItem>
            {FUEL_TYPES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gearbox */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">תיבת הילוכים</label>
        <Select value={gearbox} onValueChange={setGearbox}>
          <SelectTrigger>
            <SelectValue placeholder="הכל" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">הכל</SelectItem>
            {GEARBOX_OPTIONS.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mileage */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">ק&quot;מ מקסימלי</label>
        <Input
          type="number"
          value={maxMileage}
          onChange={(e) => setMaxMileage(e.target.value)}
          placeholder='ק"מ מקסימלי'
        />
      </div>

      {/* Hand */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">יד</label>
        <Select value={maxHand} onValueChange={setMaxHand}>
          <SelectTrigger>
            <SelectValue placeholder="כל הידות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">כל הידות</SelectItem>
            {HAND_OPTIONS.map((h) => (
              <SelectItem key={h.value} value={h.value}>
                {h.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={evOnly}
            onChange={(e) => setEvOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">חשמלי בלבד</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedSeller}
            onChange={(e) => setVerifiedSeller(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">מוכר מאומת</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={noAccidents}
            onChange={(e) => setNoAccidents(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">ללא תאונות</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button onClick={applyFilters} className="flex-1">
          החל סינון
        </Button>
        <Button variant="outline" onClick={clearFilters}>
          נקה
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="text-sm text-gray-500 mb-2">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="hover:text-gray-700">
                  ראשי
                </Link>
              </li>
              <li>
                <span className="mx-1 text-gray-300">/</span>
              </li>
              <li>
                <Link href="/cars" className="hover:text-gray-700">
                  רכב
                </Link>
              </li>
              <li>
                <span className="mx-1 text-gray-300">/</span>
              </li>
              <li className="text-gray-700 font-medium">
                {make ? `${make}${model ? ` ${model}` : ''}` : 'חיפוש'}
              </li>
            </ol>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-black tracking-tight">
                {make ? `רכבי ${make}${model ? ` ${model}` : ''} למכירה` : 'חיפוש רכבים'}
              </h1>
              {!loading && (
                <p className="text-sm text-gray-500 mt-1">
                  {total > 0 ? `${total.toLocaleString('he-IL')} תוצאות` : 'אין תוצאות'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
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

              {/* Mobile filter button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger>
                  <Button variant="outline" className="lg:hidden gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>סינון</span>
                    {activeFilterCount > 0 && <Badge className="mr-1">{activeFilterCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>סינון רכבים</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">{filterContent}</div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile sort */}
          <div className="mt-3 sm:hidden">
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
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

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              {make && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
                  {make}
                  <button onClick={() => setMake('')} className="hover:text-brand-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {model && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
                  {model}
                  <button onClick={() => setModel('')} className="hover:text-brand-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {(yearFrom || yearTo) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
                  שנתון: {yearFrom || '?'}-{yearTo || '?'}
                  <button onClick={() => { setYearFrom(''); setYearTo(''); }} className="hover:text-brand-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {(priceFrom || priceTo) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
                  מחיר: {priceFrom ? `₪${Number(priceFrom).toLocaleString()}` : '?'}-{priceTo ? `₪${Number(priceTo).toLocaleString()}` : '?'}
                  <button onClick={() => { setPriceFrom(''); setPriceTo(''); }} className="hover:text-brand-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {fuelType && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
                  {FUEL_TYPES.find(f => f.value === fuelType)?.label ?? fuelType}
                  <button onClick={() => setFuelType('')} className="hover:text-brand-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {gearbox && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
                  {GEARBOX_OPTIONS.find(g => g.value === gearbox)?.label ?? gearbox}
                  <button onClick={() => setGearbox('')} className="hover:text-brand-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {maxMileage && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
                  עד {Number(maxMileage).toLocaleString()} ק&quot;מ
                  <button onClick={() => setMaxMileage('')} className="hover:text-brand-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {verifiedSeller && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium">
                  מוכר מאומת
                  <button onClick={() => setVerifiedSeller(false)} className="hover:text-emerald-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {noAccidents && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-medium">
                  ללא תאונות
                  <button onClick={() => setNoAccidents(false)} className="hover:text-emerald-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 underline">
                נקה הכל
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-brand-black">סינון</h2>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount} פעילים</Badge>
                  )}
                </div>
                {filterContent}
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results summary bar */}
            {!loading && total > 0 && (
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                <p className="text-sm text-gray-500">
                  מציג {Math.min((page - 1) * 20 + 1, total)}-{Math.min(page * 20, total)} מתוך {total.toLocaleString('he-IL')} תוצאות
                </p>
                <button
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  onClick={async () => {
                    if (!isAuthenticated) {
                      window.location.href = '/auth/login';
                      return;
                    }
                    try {
                      const filters: Record<string, unknown> = {};
                      if (make) filters.make = make;
                      if (model) filters.model = model;
                      if (yearFrom) filters.yearFrom = yearFrom;
                      if (yearTo) filters.yearTo = yearTo;
                      if (priceFrom) filters.priceFrom = priceFrom;
                      if (priceTo) filters.priceTo = priceTo;
                      if (fuelType) filters.fuelType = fuelType;
                      if (gearbox) filters.gearbox = gearbox;
                      if (maxMileage) filters.maxMileage = maxMileage;
                      if (verifiedSeller) filters.verifiedSeller = true;
                      const res = await api.post<{ success: boolean; data: { id: string } }>('/api/saved-searches', {
                        vertical: 'cars',
                        name: make ? `${make}${model ? ` ${model}` : ''}` : null,
                        filters,
                        alertEnabled: true,
                        alertFrequency: 'daily',
                      });
                      analytics.searchSave(res.data.id, filters);
                      window.alert('החיפוש נשמר! תקבל התראות על תוצאות חדשות.');
                    } catch {
                      window.alert('שגיאה בשמירת החיפוש. נסה שוב.');
                    }
                  }}
                >
                  <Bell className="h-4 w-4" />
                  שמור חיפוש
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-6 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {results.map((car) => (
                    <ListingCard
                      key={car.id}
                      id={car.id}
                      title={car.title}
                      price={car.price.amount}
                      currency={car.price.currency}
                      isNegotiable={car.isNegotiable}
                      imageUrl={car.media[0]?.thumbnailUrl || car.media[0]?.url}
                      city={car.location.city}
                      trustScore={car.trustScore}
                      isFeatured={car.isFeatured}
                      isPromoted={car.isPromoted}
                      details={[
                        { label: 'שנה', value: String(car.car.year) },
                        { label: 'ק"מ', value: car.car.mileage.toLocaleString('he-IL') },
                        {
                          label: 'תיבת הילוכים',
                          value: car.car.gearbox === 'automatic' ? 'אוטומט' : 'ידני',
                        },
                      ]}
                      badges={car.trustFactors
                        .filter((f: { status: string; label: string }) => f.status === 'positive')
                        .slice(0, 2)
                        .map((f: { status: string; label: string }) => ({
                          label: f.label,
                          variant: 'verified' as const,
                        }))}
                      href={`/cars/${car.id}`}
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
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span>הקודם</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (page <= 4) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = page - 3 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                              page === pageNum
                                ? 'bg-brand-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <span>הבא</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center">
                <Search className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-brand-black mb-2 tracking-tight">לא נמצאו תוצאות</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  נסה לשנות את הסינון או להרחיב את החיפוש
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button variant="outline" onClick={clearFilters}>
                    נקה את כל הסינונים
                  </Button>
                  <Link href="/cars">
                    <Button variant="ghost">חזור לדף הרכב</Button>
                  </Link>
                </div>
                {/* Suggested alternatives */}
                <div className="mt-10 pt-8 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-600 mb-4">חיפושים פופולריים</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['טויוטה', 'יונדאי', 'קיה', 'מאזדה', 'BMW', 'מרצדס'].map((m) => (
                      <a
                        key={m}
                        href={`/cars/search?make=${encodeURIComponent(m)}`}
                        className="rounded-full border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-brand-black hover:border-brand-300 hover:bg-brand-50 transition-all"
                      >
                        {m}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Internal links section — always visible for SEO */}
            <section className="mt-14 border-t border-gray-100 pt-8">
              <h3 className="text-lg font-bold text-brand-black mb-4 tracking-tight">חיפושים פופולריים</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {['טויוטה', 'יונדאי', 'קיה', 'מאזדה', 'סקודה', 'BMW', 'מרצדס', 'טסלה'].map((m) => (
                  <a
                    key={m}
                    href={`/cars/search?make=${encodeURIComponent(m)}`}
                    className="text-sm text-brand-600 hover:text-brand-800 hover:underline py-1"
                  >
                    רכבי {m} למכירה
                  </a>
                ))}
                {['תל אביב', 'ירושלים', 'חיפה', 'באר שבע'].map((c) => (
                  <a
                    key={c}
                    href={`/cars/search?city=${encodeURIComponent(c)}`}
                    className="text-sm text-brand-600 hover:text-brand-800 hover:underline py-1"
                  >
                    רכבים ב{c}
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
