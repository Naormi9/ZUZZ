import type { Metadata } from 'next';
import {
  SITE_URL,
  carListingTitle,
  carListingDescription,
  formatPriceHe,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
} from '@/lib/seo';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface CarApiResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    description: string;
    price: { amount: number; currency: string };
    location: { city: string; area?: string };
    media: { url: string; thumbnailUrl?: string }[];
    car: {
      make: string;
      model: string;
      trim?: string;
      year: number;
      mileage: number;
      gearbox: string;
      fuelType: string;
      color: string;
    };
    seller: { name: string };
  };
}

async function fetchCarListing(id: string): Promise<CarApiResponse['data'] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/listings/${id}`, {
      next: { revalidate: 300 }, // cache 5 min
    });
    if (!res.ok) return null;
    const json: CarApiResponse = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchCarListing(id);

  if (!listing) {
    return {
      title: 'מודעת רכב | ZUZZ',
      description: 'צפה במודעת רכב ב-ZUZZ',
    };
  }

  const { car } = listing;
  const title = `${carListingTitle(car)} — ${formatPriceHe(listing.price.amount)} | ZUZZ`;
  const description = carListingDescription({
    make: car.make,
    model: car.model,
    year: car.year,
    mileage: car.mileage,
    gearbox: car.gearbox,
    fuelType: car.fuelType,
    city: listing.location.city,
    price: listing.price.amount,
  });

  const imageUrl = listing.media[0]?.url ?? `${SITE_URL}${DEFAULT_OG_IMAGE}`;
  const url = `${SITE_URL}/cars/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'he_IL',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${car.make} ${car.model} ${car.year}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function CarDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
