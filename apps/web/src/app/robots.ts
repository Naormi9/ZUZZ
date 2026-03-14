import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/auth/',
          '/cars/create',
          '/homes/create',
          '/market/create',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
