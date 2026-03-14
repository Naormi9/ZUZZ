import { SITE_URL, SITE_NAME, GEARBOX_HE, FUEL_HE } from './seo';

// ── JSON-LD types ───────────────────────────────────────────────────

type JsonLd = Record<string, unknown>;

/**
 * Render a JSON-LD script tag as a React element.
 * Use inside a server component or layout.
 */
export function jsonLdScript(data: JsonLd): string {
  return JSON.stringify(data);
}

// ── Organization ────────────────────────────────────────────────────

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-full.svg`,
    description: 'פלטפורמת המסחר המובילה בישראל — רכב, נדל"ן ושוק עם תשתית אמון מובנית.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['Hebrew', 'English'],
    },
  };
}

// ── WebSite with SearchAction ───────────────────────────────────────

export function webSiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'he',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/cars/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ── BreadcrumbList ──────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

// ── Vehicle (Car listing) ───────────────────────────────────────────

interface CarListingLd {
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
  isNegotiable?: boolean;
}

export function vehicleJsonLd(car: CarListingLd): JsonLd {
  const ld: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: car.title,
    description: car.description,
    brand: {
      '@type': 'Brand',
      name: car.make,
    },
    model: car.model,
    modelDate: String(car.year),
    vehicleModelDate: String(car.year),
    url: `${SITE_URL}/cars/${car.id}`,
  };

  if (car.mileage != null) {
    ld.mileageFromOdometer = {
      '@type': 'QuantitativeValue',
      value: car.mileage,
      unitCode: 'KMT',
    };
  }

  if (car.fuelType) {
    ld.fuelType = FUEL_HE[car.fuelType] ?? car.fuelType;
  }

  if (car.gearbox) {
    ld.vehicleTransmission = GEARBOX_HE[car.gearbox] ?? car.gearbox;
  }

  if (car.color) {
    ld.color = car.color;
  }

  if (car.imageUrl) {
    ld.image = car.imageUrl;
  }

  // Offer (price)
  ld.offers = {
    '@type': 'Offer',
    price: car.price,
    priceCurrency: car.currency ?? 'ILS',
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/cars/${car.id}`,
    ...(car.sellerName
      ? {
          seller: {
            '@type': 'Person',
            name: car.sellerName,
          },
        }
      : {}),
    ...(car.city
      ? {
          areaServed: {
            '@type': 'Place',
            name: car.city,
          },
        }
      : {}),
  };

  return ld;
}

// ── ItemList (for search result pages) ──────────────────────────────

interface ItemListEntry {
  url: string;
  name: string;
  position: number;
}

export function itemListJsonLd(name: string, items: ItemListEntry[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      url: item.url,
      name: item.name,
    })),
  };
}
