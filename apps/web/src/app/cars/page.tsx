'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Button,
  ListingCard,
  Skeleton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@zuzz/ui';
import { api } from '../../lib/api';
import { useRecentlyViewed } from '@/lib/hooks/use-recently-viewed';

const POPULAR_MAKES = [
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
];

const PRICE_RANGES = [
  { label: 'עד ₪30,000', value: '0-30000' },
  { label: '₪30,000 - ₪60,000', value: '30000-60000' },
  { label: '₪60,000 - ₪100,000', value: '60000-100000' },
  { label: '₪100,000 - ₪150,000', value: '100000-150000' },
  { label: '₪150,000 - ₪250,000', value: '150000-250000' },
  { label: 'מעל ₪250,000', value: '250000-999999999' },
];

const YEAR_RANGES = [
  { label: '2024-2025', value: '2024-2025' },
  { label: '2022-2023', value: '2022-2023' },
  { label: '2020-2021', value: '2020-2021' },
  { label: '2017-2019', value: '2017-2019' },
  { label: '2014-2016', value: '2014-2016' },
  { label: 'עד 2013', value: '2000-2013' },
];

export default function CarsHomePage() {
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { items: recentlyViewed } = useRecentlyViewed('cars');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>('/api/cars/featured');
        setFeaturedCars(res.data);
      } catch {
        // fail silently - show empty state
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    if (selectedMake) params.set('make', selectedMake);
    if (selectedPrice) {
      const [from, to] = selectedPrice.split('-');
      params.set('priceFrom', from ?? '');
      params.set('priceTo', to ?? '');
    }
    if (selectedYear) {
      const [from, to] = selectedYear.split('-');
      params.set('yearFrom', from ?? '');
      params.set('yearTo', to ?? '');
    }
    window.location.href = `/cars/search?${params.toString()}`;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-bl from-brand-black via-brand-charcoal to-brand-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tighter">מצא את הרכב הבא שלך</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              אלפי רכבים עם ציון אמון, מסמכים מאומתים ומוכרים מזוהים. עסקאות שזזות באמת.
            </p>
          </div>

          {/* Quick Search */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">יצרן</label>
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger>
                    <SelectValue placeholder="כל היצרנים" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_MAKES.map((make) => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">טווח מחירים</label>
                <Select value={selectedPrice} onValueChange={setSelectedPrice}>
                  <SelectTrigger>
                    <SelectValue placeholder="כל המחירים" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שנתון</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="כל השנים" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSearch} size="lg" className="w-full sm:w-auto px-10">
              חיפוש רכבים
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-heading">רכבים מומלצים</h2>
          <Link
            href="/cars/search"
            className="text-brand-600 hover:text-brand-700 text-sm font-semibold transition-colors"
          >
            הצג הכל ←
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-4 space-y-2.5">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredCars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredCars.map((car) => (
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
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">אין רכבים מומלצים כרגע</p>
            <Link href="/cars/search" className="text-brand-500 hover:underline mt-2 inline-block">
              חפש רכבים
            </Link>
          </div>
        )}
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-gray-50">
          <h2 className="section-heading mb-6">נצפו לאחרונה</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recentlyViewed.slice(0, 8).map((item) => (
              <a
                key={item.id}
                href={`/cars/${item.id}`}
                className="flex-shrink-0 w-44 rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-gray-100" />
                )}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-brand-black truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">₪{item.price.toLocaleString('he-IL')}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Popular Makes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="section-heading mb-8">חיפוש לפי יצרן</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {POPULAR_MAKES.map((make) => (
            <a
              key={make}
              href={`/cars/search?make=${encodeURIComponent(make)}`}
              className="flex items-center justify-center rounded-xl border border-gray-100 bg-white px-4 py-3.5 text-sm font-semibold text-brand-black hover:border-brand-300 hover:bg-brand-50 transition-all duration-150"
            >
              {make}
            </a>
          ))}
        </div>
      </section>

      {/* Why ZUZZ Cars - Trust Section */}
      <section className="bg-gray-50/50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="section-heading text-center mb-14">למה ZUZZ Cars?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-brand-black mb-2 tracking-tight">ציון אמון לכל מודעה</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                ציון אמון מבוסס מסמכים, אימות מוכר, היסטוריית רכב ועוד.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-brand-black mb-2 tracking-tight">מוכרים מזוהים</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                אימות זהות, אימות בעלות על הרכב ובדיקת סוחרים מורשים.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-brand-black mb-2 tracking-tight">מסמכים ברורים</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                רישיון רכב, טסט, ביטוח ודוח בדיקה — הכל שקוף ונגיש.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-brand-black mb-2 tracking-tight">תקשורת ישירה</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                הודעות, שיחה טלפונית או תיאום בדיקה — ישירות מהמודעה.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search by city */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="section-heading mb-8">חיפוש לפי עיר</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            'תל אביב',
            'ירושלים',
            'חיפה',
            'באר שבע',
            'רמת גן',
            'הרצליה',
            'נתניה',
            'ראשון לציון',
            'פתח תקווה',
            'אשדוד',
            'רעננה',
            'כפר סבא',
          ].map((city) => (
            <a
              key={city}
              href={`/cars/search?city=${encodeURIComponent(city)}`}
              className="flex items-center justify-center rounded-xl border border-gray-100 bg-white px-4 py-3.5 text-sm font-semibold text-brand-black hover:border-brand-300 hover:bg-brand-50 transition-all duration-150"
            >
              רכבים ב{city}
            </a>
          ))}
        </div>
      </section>

      {/* Search by type */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-gray-100">
        <h2 className="section-heading mb-8">חיפוש לפי סוג</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'רכבים חשמליים', href: '/cars/search?fuelType=electric' },
            { label: 'רכבים היברידיים', href: '/cars/search?fuelType=hybrid' },
            { label: 'SUV וקרוסאובר', href: '/cars/search?bodyType=suv' },
            { label: 'רכבי יד ראשונה', href: '/cars/search?maxHand=1' },
            { label: 'מוכרים מאומתים', href: '/cars/search?verifiedSeller=true' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center justify-center rounded-xl border border-gray-100 bg-white px-4 py-3.5 text-sm font-semibold text-brand-black hover:border-brand-300 hover:bg-brand-50 transition-all duration-150 text-center"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">רוצה למכור את הרכב?</h2>
          <p className="text-gray-400 mb-8">פרסם מודעה ב-ZUZZ תוך דקות ותגיע לקונים רציניים.</p>
          <Button onClick={() => (window.location.href = '/cars/create')} size="lg" className="px-10">
            פרסם מודעת רכב
          </Button>
        </div>
      </section>
    </div>
  );
}
