'use client';

import { useEffect, useState } from 'react';

interface CarJsonLdData {
  id: string;
  title: string;
  description?: string;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  gearbox?: string;
  fuelType?: string;
  color?: string;
  price: number;
  currency?: string;
  city?: string;
  imageUrl?: string;
  sellerName?: string;
}

/**
 * Client-side JSON-LD injector for car detail page.
 * Inserts/updates the JSON-LD script once car data is loaded.
 */
export function CarDetailJsonLd({ data }: { data: CarJsonLdData | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !data) return null;

  const SITE_URL =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.zuzz.co.il';

  const GEARBOX_HE: Record<string, string> = {
    automatic: 'אוטומט',
    manual: 'ידני',
    robotic: 'רובוטי',
  };

  const FUEL_HE: Record<string, string> = {
    petrol: 'בנזין',
    diesel: 'דיזל',
    hybrid: 'היברידי',
    electric: 'חשמלי',
    lpg: 'גז',
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: data.title,
    description: data.description,
    brand: { '@type': 'Brand', name: data.make },
    model: data.model,
    modelDate: String(data.year),
    vehicleModelDate: String(data.year),
    url: `${SITE_URL}/cars/${data.id}`,
    ...(data.mileage != null
      ? {
          mileageFromOdometer: {
            '@type': 'QuantitativeValue',
            value: data.mileage,
            unitCode: 'KMT',
          },
        }
      : {}),
    ...(data.fuelType ? { fuelType: FUEL_HE[data.fuelType] ?? data.fuelType } : {}),
    ...(data.gearbox ? { vehicleTransmission: GEARBOX_HE[data.gearbox] ?? data.gearbox } : {}),
    ...(data.color ? { color: data.color } : {}),
    ...(data.imageUrl ? { image: data.imageUrl } : {}),
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.currency ?? 'ILS',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/cars/${data.id}`,
      ...(data.sellerName ? { seller: { '@type': 'Person', name: data.sellerName } } : {}),
      ...(data.city ? { areaServed: { '@type': 'Place', name: data.city } } : {}),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
