'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Badge, ListingCard } from '@zuzz/ui';
import { api } from '@/lib/api';
import { Building2, MapPin, Phone, Mail, Globe, Shield, Package } from 'lucide-react';

interface DealerOrg {
  id: string;
  name: string;
  type: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  region: string | null;
  verificationStatus: string;
  dealerProfile: {
    specialties: string[];
    openingHours: any;
    avgResponseTime: number | null;
    avgResponseRate: number | null;
    rating: number | null;
    reviewCount: number;
  } | null;
  _count: { listings: number; members: number };
}

interface ListingItem {
  id: string;
  title: string;
  priceAmount: number;
  priceCurrency: string;
  isNegotiable: boolean;
  media: { url: string; thumbnailUrl?: string }[];
  city: string;
  trustScore: number;
  isFeatured: boolean;
  isPromoted: boolean;
  carDetails?: { make: string; model: string; year: number; mileage: number; gearbox: string };
}

export default function DealerProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [org, setOrg] = useState<DealerOrg | null>(null);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [orgRes, listingsRes] = await Promise.all([
          api.get<{ success: boolean; data: DealerOrg }>(`/api/organizations/${id}`),
          api.get<{ success: boolean; data: { data: ListingItem[]; total: number } }>(
            `/api/organizations/${id}/public-listings?pageSize=12`,
          ),
        ]);
        setOrg(orgRes.data);
        setListings(listingsRes.data.data);
        setListingsTotal(listingsRes.data.total);
      } catch {
        // handled by empty state
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-48 w-full mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">סוחר לא נמצא</h1>
          <Link href="/cars/search">
            <Button>חזרה לחיפוש</Button>
          </Link>
        </div>
      </div>
    );
  }

  const TYPE_LABELS: Record<string, string> = {
    dealer: 'סוחר רכב',
    agency: 'סוכנות נדל"ן',
    developer: 'יזם',
    business: 'עסק',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="text-sm text-gray-500 mb-4">
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
              <li className="text-gray-700 font-medium">{org.name}</li>
            </ol>
          </nav>

          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {org.logoUrl ? (
                <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                {org.verificationStatus === 'verified' && (
                  <Badge className="text-xs bg-green-100 text-green-700 gap-1">
                    <Shield className="h-3 w-3" />
                    מאומת
                  </Badge>
                )}
                <Badge className="text-xs bg-gray-100 text-gray-700">
                  {TYPE_LABELS[org.type] || org.type}
                </Badge>
              </div>
              {org.description && <p className="text-gray-600 mt-2 max-w-2xl">{org.description}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                {org.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {org.city}
                    {org.region ? `, ${org.region}` : ''}
                  </span>
                )}
                {org.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {org.phone}
                  </span>
                )}
                {org.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {org.email}
                  </span>
                )}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-brand-600 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    אתר
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {org._count.listings} מודעות
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {listingsTotal > 0 ? `${listingsTotal} מודעות פעילות` : 'אין מודעות פעילות'}
        </h2>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.priceAmount}
                currency={listing.priceCurrency}
                isNegotiable={listing.isNegotiable}
                imageUrl={listing.media[0]?.thumbnailUrl || listing.media[0]?.url}
                city={listing.city}
                trustScore={listing.trustScore}
                isFeatured={listing.isFeatured}
                isPromoted={listing.isPromoted}
                details={
                  listing.carDetails
                    ? [
                        { label: 'שנה', value: String(listing.carDetails.year) },
                        {
                          label: 'ק"מ',
                          value: listing.carDetails.mileage?.toLocaleString('he-IL') || '-',
                        },
                      ]
                    : []
                }
                href={`/cars/${listing.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>אין מודעות פעילות כרגע</p>
          </div>
        )}
      </div>
    </div>
  );
}
