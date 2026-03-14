import type { Metadata } from 'next';

/** Base URL for the site — used for canonical URLs and OG metadata */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.zuzz.co.il';
export const SITE_NAME = 'ZUZZ';
export const SITE_NAME_HE = 'ZUZZ — המקום שבו עסקאות זזות באמת';

/** Default OG image path (relative to public/) */
export const DEFAULT_OG_IMAGE = '/brand/og-default.png';

// ── Hebrew label maps ──────────────────────────────────────────────

export const GEARBOX_HE: Record<string, string> = {
  automatic: 'אוטומט',
  manual: 'ידני',
  robotic: 'רובוטי',
  cvt: 'CVT',
};

export const FUEL_HE: Record<string, string> = {
  petrol: 'בנזין',
  diesel: 'דיזל',
  hybrid: 'היברידי',
  phev: 'פלאג-אין היברידי',
  electric: 'חשמלי',
  lpg: 'גז',
  cng: 'CNG',
};

export const BODY_TYPE_HE: Record<string, string> = {
  sedan: 'סדאן',
  hatchback: 'האצ׳בק',
  suv: 'SUV',
  crossover: 'קרוסאובר',
  coupe: 'קופה',
  convertible: 'קבריולה',
  wagon: 'סטיישן',
  van: 'ואן',
  pickup: 'טנדר',
  minivan: 'מיניוואן',
  commercial: 'מסחרי',
};

export const PROPERTY_TYPE_HE: Record<string, string> = {
  apartment: 'דירה',
  house: 'בית פרטי',
  penthouse: 'פנטהאוז',
  garden_apartment: 'דירת גן',
  duplex: 'דופלקס',
  studio: 'סטודיו',
  villa: 'וילה',
  cottage: 'קוטג׳',
  lot: 'מגרש',
  commercial: 'מסחרי',
  office: 'משרד',
};

export const MARKET_CATEGORY_HE: Record<string, string> = {
  electronics: 'אלקטרוניקה',
  furniture: 'ריהוט',
  fashion: 'אופנה',
  sports: 'ספורט',
  garden: 'גינה',
  kids: 'ילדים',
  pets: 'חיות מחמד',
  books: 'ספרים',
  music: 'מוזיקה',
  collectibles: 'אספנות',
  tools: 'כלי עבודה',
};

export const REGION_HE: Record<string, string> = {
  tel_aviv: 'תל אביב',
  sharon: 'השרון',
  jerusalem: 'ירושלים',
  center: 'מרכז',
  north: 'צפון',
  south: 'דרום',
  haifa: 'חיפה',
  shfela: 'שפלה',
  negev: 'נגב',
};

// ── Popular makes (Hebrew) ──────────────────────────────────────────

export const POPULAR_MAKES = [
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
  'טסלה',
  'וולוו',
  'לקסוס',
  'מיני',
] as const;

export const POPULAR_CITIES = [
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
  'חולון',
  'בת ים',
  'אשקלון',
  'מודיעין',
  'רחובות',
  'לוד',
  'נצרת',
  'עכו',
] as const;

// ── Utility: build canonical URL ────────────────────────────────────

export function canonicalUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

// ── Utility: format price in ILS ────────────────────────────────────

export function formatPriceHe(amount: number, currency = 'ILS'): string {
  const symbol = currency === 'ILS' ? '₪' : '$';
  return `${symbol}${amount.toLocaleString('he-IL')}`;
}

// ── Metadata builders ───────────────────────────────────────────────

interface MetaOpts {
  title: string;
  description: string;
  path: string;
  /** Override OG image URL (absolute or relative to public/) */
  image?: string;
  /** Set to true to add noindex,nofollow */
  noIndex?: boolean;
  /** Override OG type (default: website) */
  ogType?: 'website' | 'article';
}

/**
 * Build a complete Metadata object with OG, Twitter, canonical, and robots.
 * Use this in generateMetadata() or as a static metadata export.
 */
export function buildMetadata(opts: MetaOpts): Metadata {
  const imageUrl = opts.image
    ? opts.image.startsWith('http')
      ? opts.image
      : `${SITE_URL}${opts.image}`
    : `${SITE_URL}${DEFAULT_OG_IMAGE}`;

  const url = canonicalUrl(opts.path);

  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE_NAME,
      locale: 'he_IL',
      type: opts.ogType ?? 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: opts.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [imageUrl],
    },
    ...(opts.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

// ── Car metadata helpers ────────────────────────────────────────────

export function carListingTitle(car: {
  make: string;
  model: string;
  year: number;
  trim?: string;
}): string {
  const parts = [car.make, car.model];
  if (car.trim) parts.push(car.trim);
  parts.push(String(car.year));
  return parts.join(' ');
}

export function carListingDescription(car: {
  make: string;
  model: string;
  year: number;
  mileage?: number;
  gearbox?: string;
  fuelType?: string;
  city?: string;
  price?: number;
}): string {
  const parts: string[] = [];
  parts.push(`${car.make} ${car.model} ${car.year}`);
  if (car.mileage) parts.push(`${car.mileage.toLocaleString('he-IL')} ק"מ`);
  if (car.gearbox) parts.push(GEARBOX_HE[car.gearbox] ?? car.gearbox);
  if (car.fuelType) parts.push(FUEL_HE[car.fuelType] ?? car.fuelType);
  if (car.city) parts.push(car.city);
  if (car.price) parts.push(formatPriceHe(car.price));
  return `למכירה ב-ZUZZ: ${parts.join(' | ')}. עם ציון אמון, מסמכים מאומתים ומוכרים מזוהים.`;
}

// ── Search page title helpers ───────────────────────────────────────

export function carsSearchTitle(filters: {
  make?: string;
  model?: string;
  city?: string;
  fuelType?: string;
}): string {
  const parts: string[] = [];
  if (filters.make) parts.push(filters.make);
  if (filters.model) parts.push(filters.model);
  if (filters.fuelType) parts.push(FUEL_HE[filters.fuelType] ?? filters.fuelType);
  if (filters.city) parts.push(`ב${filters.city}`);

  if (parts.length > 0) {
    return `רכבים למכירה — ${parts.join(' ')} | ZUZZ`;
  }
  return 'חיפוש רכבים למכירה | ZUZZ';
}

export function carsSearchDescription(filters: {
  make?: string;
  model?: string;
  city?: string;
  total?: number;
}): string {
  const parts: string[] = [];
  if (filters.make) parts.push(filters.make);
  if (filters.model) parts.push(filters.model);
  if (filters.city) parts.push(`ב${filters.city}`);
  const countStr = filters.total ? `${filters.total.toLocaleString('he-IL')} ` : '';

  if (parts.length > 0) {
    return `${countStr}מודעות רכב ${parts.join(' ')} למכירה ב-ZUZZ. ציון אמון, מסמכים מאומתים ומוכרים מזוהים.`;
  }
  return `${countStr}מודעות רכב למכירה ב-ZUZZ. חיפוש מתקדם עם ציון אמון, מסמכים מאומתים ומוכרים מזוהים.`;
}
