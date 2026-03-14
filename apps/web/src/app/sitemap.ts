import type { MetadataRoute } from 'next';
import { SITE_URL, POPULAR_MAKES, POPULAR_CITIES } from '@/lib/seo';

/**
 * Dynamic sitemap generation.
 *
 * Static pages + landing pages are generated here.
 * In production, listing detail pages should be fetched from the API
 * and appended; for now we generate the structural sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [];

  // ── Static pages ─────────────────────────────────────────────────
  const staticPages = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/cars', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/cars/search', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/homes', priority: 0.7, changeFrequency: 'daily' as const },
    { path: '/homes/search', priority: 0.6, changeFrequency: 'daily' as const },
    { path: '/market', priority: 0.6, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/trust', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.3, changeFrequency: 'monthly' as const },
    { path: '/guides/buying-car', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/guides/selling-car', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/terms', priority: 0.2, changeFrequency: 'monthly' as const },
    { path: '/privacy', priority: 0.2, changeFrequency: 'monthly' as const },
    { path: '/accessibility', priority: 0.2, changeFrequency: 'monthly' as const },
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${SITE_URL}${page.path}`,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  // ── Cars by make landing pages ───────────────────────────────────
  for (const make of POPULAR_MAKES) {
    entries.push({
      url: `${SITE_URL}/cars/search?make=${encodeURIComponent(make)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  // ── Cars by city landing pages ───────────────────────────────────
  for (const city of POPULAR_CITIES) {
    entries.push({
      url: `${SITE_URL}/cars/search?city=${encodeURIComponent(city)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    });
  }

  // ── Homes by city landing pages ──────────────────────────────────
  for (const city of POPULAR_CITIES) {
    entries.push({
      url: `${SITE_URL}/homes/search?city=${encodeURIComponent(city)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  return entries;
}
