'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  Input,
  Badge,
  Skeleton,
  TrustBadge,
  PriceDisplay,
  SellerCard,
  ListingCard,
} from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  Heart,
  Share2,
  Flag,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  Zap,
  Calendar,
  Gauge,
  Hand,
  Settings,
  Fuel,
  Palette,
  Users,
  Car,
  ClipboardCheck,
} from 'lucide-react';
import { CarDetailJsonLd } from './car-detail-jsonld';

interface CarMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
}

interface CarListing {
  id: string;
  title: string;
  description: string;
  price: { amount: number; currency: string };
  isNegotiable: boolean;
  status: string;
  media: CarMedia[];
  location: { city: string; area: string };
  trustScore: number;
  trustFactors: { key: string; label: string; status: string; description?: string }[];
  isFeatured: boolean;
  isPromoted: boolean;
  isFavorited?: boolean;
  createdAt: string;
  car: {
    make: string;
    model: string;
    subModel: string;
    year: number;
    mileage: number;
    hand: number;
    gearbox: string;
    fuelType: string;
    engineSize: number;
    horsepower: number;
    seats: number;
    color: string;
    testUntil: string;
    isEV: boolean;
    evRange?: number;
    batteryCapacity?: number;
    chargingTime?: string;
  };
  sellerStatements: { key: string; label: string; value: boolean; note?: string }[];
  documents: { id: string; type: string; label: string; verified: boolean }[];
  seller: {
    id: string;
    name: string;
    avatarUrl?: string;
    isVerified: boolean;
    isDealer: boolean;
    memberSince: string;
    listingsCount: number;
    trustScore: number;
  };
}

interface SimilarCar {
  id: string;
  title: string;
  price: { amount: number; currency: string };
  isNegotiable: boolean;
  media: { url: string; thumbnailUrl?: string }[];
  location: { city: string };
  trustScore: number;
  isFeatured: boolean;
  isPromoted: boolean;
  car: { year: number; mileage: number; gearbox: string };
  trustFactors: { label: string; status: string }[];
}

const GEARBOX_LABELS: Record<string, string> = {
  automatic: 'אוטומט',
  manual: 'ידני',
  robotic: 'רובוטי',
};

const FUEL_LABELS: Record<string, string> = {
  petrol: 'בנזין',
  diesel: 'דיזל',
  hybrid: 'היברידי',
  electric: 'חשמלי',
  lpg: 'גז',
};

export default function CarDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated } = useAuth();

  const [listing, setListing] = useState<CarListing | null>(null);
  const [similarCars, setSimilarCars] = useState<SimilarCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadSent, setLeadSent] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [listingRes, similarRes] = await Promise.all([
          api.get<{ success: boolean; data: CarListing }>(`/api/listings/${id}`),
          api.get<{ success: boolean; data: SimilarCar[] }>(`/api/cars/${id}/similar?limit=6`),
        ]);
        setListing(listingRes.data);
        setIsFavorited(listingRes.data.isFavorited ?? false);
        setSimilarCars(similarRes.data);
      } catch {
        // handled by empty state
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  async function toggleFavorite() {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }
    try {
      const res = await api.post<{ success: boolean; data: { isFavorited: boolean } }>(
        `/api/favorites/${id}`,
      );
      setIsFavorited(res.data.isFavorited);
    } catch {
      // fail silently
    }
  }

  async function submitLead() {
    try {
      await api.post('/api/leads', {
        listingId: id,
        name: leadName,
        phone: leadPhone,
        message: leadMessage,
      });
      setLeadSent(true);
    } catch {
      // fail silently
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: listing?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="aspect-[16/9] w-full rounded-2xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-black mb-2 tracking-tight">המודעה לא נמצאה</h1>
          <p className="text-gray-500 mb-6">ייתכן שהמודעה הוסרה או שהקישור שגוי.</p>
          <Link href="/cars/search">
            <Button>חזור לחיפוש</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { car } = listing;

  const vehicleFacts = [
    { icon: Calendar, label: 'שנה', value: String(car.year) },
    { icon: Gauge, label: 'ק"מ', value: car.mileage.toLocaleString('he-IL') },
    { icon: Hand, label: 'יד', value: `יד ${car.hand}` },
    { icon: Settings, label: 'תיבת הילוכים', value: GEARBOX_LABELS[car.gearbox] || car.gearbox },
    { icon: Fuel, label: 'דלק', value: FUEL_LABELS[car.fuelType] || car.fuelType },
    { icon: Car, label: 'נפח מנוע', value: car.engineSize ? `${car.engineSize} סמ"ק` : '-' },
    { icon: Zap, label: 'כוח סוס', value: car.horsepower ? `${car.horsepower} כ"ס` : '-' },
    { icon: Users, label: 'מושבים', value: String(car.seats) },
    { icon: Palette, label: 'צבע', value: car.color },
    {
      icon: ClipboardCheck,
      label: 'טסט עד',
      value: car.testUntil ? new Date(car.testUntil).toLocaleDateString('he-IL') : '-',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD structured data */}
      <CarDetailJsonLd
        data={
          listing
            ? {
                id: listing.id,
                title: listing.title,
                description: listing.description,
                make: car.make,
                model: car.model,
                year: car.year,
                mileage: car.mileage,
                gearbox: car.gearbox,
                fuelType: car.fuelType,
                color: car.color,
                price: listing.price.amount,
                currency: listing.price.currency,
                city: listing.location.city,
                imageUrl: listing.media[0]?.url,
                sellerName: listing.seller.name,
              }
            : null
        }
      />

      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 text-sm text-gray-500">
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
          <li>
            <Link
              href={`/cars/search?make=${encodeURIComponent(car.make)}`}
              className="hover:text-gray-700"
            >
              {car.make}
            </Link>
          </li>
          <li>
            <span className="mx-1 text-gray-300">/</span>
          </li>
          <li className="text-gray-700 font-medium">
            {car.make} {car.model} {car.year}
          </li>
        </ol>
      </nav>

      {/* Image Gallery */}
      <div className="bg-black">
        <div className="max-w-5xl mx-auto relative">
          {listing.media.length > 0 ? (
            <>
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={listing.media[activeImage]?.url}
                  alt={listing.title}
                  className="w-full h-full object-contain"
                />

                {listing.media.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((prev) => (prev + 1) % listing.media.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImage(
                          (prev) => (prev - 1 + listing.media.length) % listing.media.length,
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                  {activeImage + 1} / {listing.media.length}
                </div>
              </div>

              {/* Thumbnails */}
              {listing.media.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {listing.media.map((media, idx) => (
                    <button
                      key={media.id}
                      onClick={() => setActiveImage(idx)}
                      className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        idx === activeImage
                          ? 'border-brand-500'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={media.thumbnailUrl || media.url}
                        alt={`תמונה ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-[16/9] flex items-center justify-center bg-gray-200">
              <Car className="h-24 w-24 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title + Price + Actions */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-brand-black tracking-tight">{listing.title}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {listing.location.city}{' '}
                    {listing.location.area ? `- ${listing.location.area}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={toggleFavorite}
                    className={`p-2 rounded-full border transition-colors ${
                      isFavorited
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowReport(!showReport)}
                    className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-3xl font-bold text-brand-500">
                  {listing.price.currency === 'ILS' ? '₪' : '$'}
                  {listing.price.amount.toLocaleString('he-IL')}
                </span>
                {listing.isNegotiable && <Badge variant="secondary">ניתן למשא ומתן</Badge>}
              </div>

              {/* Trust Score */}
              <div className="mt-4">
                <TrustBadge score={listing.trustScore} />
              </div>
            </div>

            {/* Vehicle Facts Grid */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-brand-black mb-4 tracking-tight">פרטי הרכב</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {vehicleFacts.map((fact) => (
                    <div key={fact.label} className="text-center p-3 rounded-lg bg-gray-50">
                      <fact.icon className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">{fact.label}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* EV Section */}
            {car.isEV && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-brand-black mb-4 flex items-center gap-2 tracking-tight">
                    <Zap className="h-5 w-5 text-green-600" />
                    נתוני רכב חשמלי
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {car.evRange && (
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500">טווח נסיעה</p>
                        <p className="text-xl font-bold text-green-700">{car.evRange} ק&quot;מ</p>
                      </div>
                    )}
                    {car.batteryCapacity && (
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500">קיבולת סוללה</p>
                        <p className="text-xl font-bold text-green-700">
                          {car.batteryCapacity} kWh
                        </p>
                      </div>
                    )}
                    {car.chargingTime && (
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500">זמן טעינה</p>
                        <p className="text-xl font-bold text-green-700">{car.chargingTime}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {listing.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-brand-black mb-3 tracking-tight">תיאור</h2>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {listing.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Seller Statements */}
            {listing.sellerStatements.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-brand-black mb-4 tracking-tight">הצהרות המוכר</h2>
                  <div className="space-y-3">
                    {listing.sellerStatements.map((statement) => (
                      <div key={statement.key} className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                            statement.value
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {statement.value ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{statement.label}</p>
                          {statement.note && (
                            <p className="text-xs text-gray-500 mt-0.5">{statement.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {listing.documents.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-brand-black mb-4 flex items-center gap-2 tracking-tight">
                    <FileText className="h-5 w-5 text-gray-400" />
                    מסמכים
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listing.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                      >
                        <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 flex-1">{doc.label}</span>
                        {doc.verified && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-700"
                          >
                            <Shield className="h-3 w-3 ml-1" />
                            מאומת
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trust Factors */}
            {listing.trustFactors.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-brand-black mb-4 flex items-center gap-2 tracking-tight">
                    <Shield className="h-5 w-5 text-brand-500" />
                    גורמי אמון
                  </h2>
                  <div className="space-y-3">
                    {listing.trustFactors.map((factor) => (
                      <div key={factor.key} className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                            factor.status === 'positive'
                              ? 'bg-green-500'
                              : factor.status === 'negative'
                                ? 'bg-red-500'
                                : 'bg-gray-300'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{factor.label}</p>
                          {factor.description && (
                            <p className="text-xs text-gray-500">{factor.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contact Actions */}
            <Card className="sticky top-20">
              <CardContent className="p-5 space-y-3">
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = '/auth/login';
                      return;
                    }
                    window.location.href = `/dashboard/messages?to=${listing.seller.id}&listing=${id}`;
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  שלח הודעה
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowLeadForm(!showLeadForm)}
                >
                  <Phone className="h-4 w-4" />
                  השאר פרטים
                </Button>

                {/* Lead Form */}
                {showLeadForm && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    {leadSent ? (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">הפרטים נשלחו בהצלחה</p>
                        <p className="text-xs text-gray-500 mt-1">המוכר ייצור איתך קשר בהקדם</p>
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder="שם מלא"
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                        />
                        <Input
                          placeholder="טלפון"
                          type="tel"
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                        />
                        <textarea
                          placeholder="הודעה (אופציונלי)"
                          value={leadMessage}
                          onChange={(e) => setLeadMessage(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                          rows={3}
                        />
                        <Button
                          onClick={submitLead}
                          className="w-full"
                          disabled={!leadName || !leadPhone}
                        >
                          שלח פרטים
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seller Card */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold text-brand-black mb-3 tracking-tight">פרטי המוכר</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {listing.seller.avatarUrl ? (
                      <img
                        src={listing.seller.avatarUrl}
                        alt={listing.seller.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-500">
                        {listing.seller.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{listing.seller.name}</span>
                      {listing.seller.isVerified && (
                        <Badge className="text-xs bg-brand-50 text-brand-700">מאומת</Badge>
                      )}
                      {listing.seller.isDealer && (
                        <Badge className="text-xs bg-purple-100 text-purple-700">סוחר</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      ב-ZUZZ מאז{' '}
                      {new Date(listing.seller.memberSince).toLocaleDateString('he-IL', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-900">
                      {listing.seller.listingsCount}
                    </p>
                    <p className="text-xs text-gray-500">מודעות</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-gray-900">{listing.seller.trustScore}</p>
                    <p className="text-xs text-gray-500">ציון אמון</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Report */}
            {showReport && (
              <Card className="border-red-200">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">דיווח על מודעה</h3>
                  <textarea
                    placeholder="תאר את הבעיה..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                    rows={3}
                  />
                  <Button
                    variant="outline"
                    className="w-full mt-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowReport(false)}
                  >
                    שלח דיווח
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Links */}
        <section className="mt-8 border-t border-gray-100 pt-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/cars/search?make=${encodeURIComponent(car.make)}`}
              className="text-sm text-brand-600 hover:text-brand-800 hover:underline"
            >
              כל רכבי {car.make}
            </Link>
            <Link
              href={`/cars/search?make=${encodeURIComponent(car.make)}&model=${encodeURIComponent(car.model)}`}
              className="text-sm text-brand-600 hover:text-brand-800 hover:underline"
            >
              {car.make} {car.model} למכירה
            </Link>
            {listing.location.city && (
              <Link
                href={`/cars/search?city=${encodeURIComponent(listing.location.city)}`}
                className="text-sm text-brand-600 hover:text-brand-800 hover:underline"
              >
                רכבים ב{listing.location.city}
              </Link>
            )}
            <Link
              href="/cars"
              className="text-sm text-brand-600 hover:text-brand-800 hover:underline"
            >
              כל הרכבים
            </Link>
          </div>
        </section>

        {/* Similar Cars */}
        {similarCars.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-brand-black mb-6 tracking-tight">רכבים דומים</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto">
              {similarCars.map((car) => (
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
                  ]}
                  badges={car.trustFactors
                    .filter((f) => f.status === 'positive')
                    .slice(0, 2)
                    .map((f) => ({ label: f.label, variant: 'verified' as const }))}
                  href={`/cars/${car.id}`}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
