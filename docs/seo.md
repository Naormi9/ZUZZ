# SEO Architecture — ZUZZ

## Overview

ZUZZ implements a comprehensive SEO foundation optimized for the Israeli market (Hebrew-first, RTL-native). The architecture covers metadata, crawlability, structured data, indexing policy, and internal linking — Cars-first, with coherent Homes and Market support.

## Metadata Architecture

### Root Layout (`apps/web/src/app/layout.tsx`)

- **metadataBase**: Set to `SITE_URL` (default: `https://www.zuzz.co.il`)
- **Title template**: `%s | ZUZZ` — all child pages use this template
- **Default title**: `ZUZZ — המקום שבו עסקאות זזות באמת`
- **Language**: `he` (Hebrew), `dir="rtl"`
- **OG locale**: `he_IL`
- **Twitter card**: `summary_large_image`

### Dynamic Metadata

| Page                         | Metadata Source                          | Strategy                                                     |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| Homepage                     | Static export                            | Root layout defaults                                         |
| Cars landing `/cars`         | Static in layout.tsx                     | Hebrew-optimized title/description                           |
| Car detail `/cars/[id]`      | `generateMetadata()` in layout.tsx       | Fetches listing from API, builds make/model/year/price title |
| Cars search `/cars/search`   | Static layout + client-side title update | Layout provides base, client updates title per filters       |
| Homes landing `/homes`       | Static in layout.tsx                     | Hebrew-optimized                                             |
| Homes search `/homes/search` | Static in layout.tsx                     | Hebrew-optimized                                             |
| Market `/market`             | Static in layout.tsx                     | Hebrew-optimized                                             |
| Guides                       | Static `buildMetadata()` per page        | Article-type OG                                              |
| Static pages                 | Static `buildMetadata()` per page        | Standard                                                     |
| Dashboard / Auth / Create    | Static with `noindex`                    | Excluded from indexing                                       |

### SEO Utility Library (`apps/web/src/lib/seo.ts`)

Core helper: `buildMetadata(opts)` — generates complete `Metadata` object with:

- Title, description
- Canonical URL
- Open Graph (title, description, url, image, locale, siteName)
- Twitter Card
- Optional noindex

Additional helpers:

- `carListingTitle()` — builds Hebrew car title from make/model/year
- `carListingDescription()` — builds description with specs and price
- `carsSearchTitle()` / `carsSearchDescription()` — search page metadata
- `formatPriceHe()` — Israeli shekel formatting
- Hebrew label maps for fuel types, gearbox, body types, regions, etc.

## robots.txt

Generated via Next.js route handler (`apps/web/src/app/robots.ts`).

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /cars/create
Disallow: /homes/create
Disallow: /market/create
Sitemap: https://www.zuzz.co.il/sitemap.xml
```

## Sitemap

Generated via `apps/web/src/app/sitemap.ts`. Includes:

1. **Static pages** — homepage, vertical landings, search pages, guides, legal pages
2. **Cars by make** — one entry per popular make (24 makes)
3. **Cars by city** — one entry per popular city (20 cities)
4. **Homes by city** — one entry per popular city (20 cities)

Total: ~75 URLs. Listing detail pages should be added when listing volume justifies it (fetch from API).

## Canonical URL Strategy

- Every page includes `alternates.canonical` pointing to its clean URL
- Search pages: canonical points to the base search URL (e.g., `/cars/search`)
- Listing pages: canonical is `/cars/{id}`
- No trailing slashes
- Query parameters not included in canonical (prevents duplicate content from filter combinations)

## noindex / index Policy

| Page Type                    | Indexed?       | Reason                                 |
| ---------------------------- | -------------- | -------------------------------------- |
| Homepage                     | Yes            | Core page                              |
| Vertical landing pages       | Yes            | High-value category pages              |
| Listing detail pages         | Yes            | Individual content pages               |
| Search pages (0-2 filters)   | Yes            | High-value landing pages               |
| Search pages (3+ filters)    | No             | Prevent index bloat from filter combos |
| Dashboard pages              | No             | User-private content                   |
| Auth pages                   | No             | No SEO value                           |
| Create/edit pages            | No             | No SEO value                           |
| Paginated results (page > 1) | Follow default | Crawlable but not primary              |

## Structured Data (JSON-LD)

### Global (root layout)

- **Organization** — ZUZZ brand, logo, description
- **WebSite** — with `SearchAction` pointing to `/cars/search?q={search_term_string}`

### Car Detail Pages

- **Vehicle** schema with:
  - Brand, model, modelDate
  - mileageFromOdometer
  - fuelType, vehicleTransmission, color
  - Offer (price, currency, availability, seller, areaServed)
- Injected client-side after data loads via `CarDetailJsonLd` component

### Breadcrumbs

- **BreadcrumbList** on guide pages
- Visible breadcrumb navigation on car detail pages and search pages

### Content Pages

- **BreadcrumbList** on guide pages via `JsonLd` component

## Internal Linking Strategy

### Footer

Restructured with SEO-focused links:

- **Cars section**: landing, search, top 3 makes, electric vehicles
- **Real estate & market**: landing pages
- **ZUZZ section**: about, contact, trust, buying guide, selling guide
- **Support**: terms, privacy, accessibility, publish CTA

### Car Detail Pages

- Breadcrumb: Home → Cars → Make → Current listing
- Related links: all cars by same make, make+model search, cars in same city
- Similar cars section (existing)

### Cars Search Page

- Breadcrumb: Home → Cars → Current search
- Popular searches section at bottom: top makes + top cities

### Cars Landing Page

- Search by make grid (12 popular makes)
- Search by city grid (12 popular cities)
- Search by type (electric, hybrid, SUV, first-hand, verified sellers)
- Featured listings with links

## Editorial / Content Foundation

### API

- `GET /api/articles` — list published articles
- `GET /api/articles/:slug` — get article by slug

### Database Model

The `Article` model supports:

- `slug` (unique), `type` (page, guide, article, landing)
- `title` / `titleHe`, `content` / `contentHe`
- `seoTitle`, `seoDescription`
- `coverImage`, `excerpt`
- `isPublished`, `publishedAt`

### Content Pages Created

- `/guides/buying-car` — Car buying guide (Hebrew, real content)
- `/guides/selling-car` — Car selling guide (Hebrew, real content)
- `/about` — About ZUZZ
- `/trust` — Trust and safety
- `/contact` — Contact page
- `/terms` — Terms of service (placeholder)
- `/privacy` — Privacy policy (placeholder)
- `/accessibility` — Accessibility statement

### Content Expansion Rules

1. Only create content that provides real value to users
2. No auto-generated spam or thin content
3. Each guide should link to relevant product pages
4. All content pages use `buildMetadata()` for proper SEO
5. Article-type pages use `ogType: 'article'`
6. Future articles should be created via the CMS API, not hardcoded

## Social Sharing

- **Open Graph**: All key pages include og:title, og:description, og:image, og:url, og:locale, og:site_name
- **Twitter Cards**: `summary_large_image` with title, description, image
- **Car detail pages**: Dynamic OG image from listing's first photo, title with make/model/year/price
- **Default OG image**: `/brand/og-default.png` (should be created — 1200x630px)

## Performance Considerations

- Metadata generation uses lightweight server-side fetches with `revalidate: 300` caching
- No heavy computation in metadata generation
- Sitemap is statically generated (no API calls per request)
- JSON-LD for car listings is client-side to avoid blocking server render
- No sitemap bottlenecks — ~75 URLs currently

## Deferred Items

- [ ] Dynamic OG image generation (Next.js `ImageResponse`)
- [ ] Listing detail URLs in sitemap (requires API integration at build time or ISR)
- [ ] hreflang tags (when English support is added)
- [ ] Article/CMS pages rendered from database content
- [ ] Homes and Market detail page metadata (when routes exist)
- [ ] Rich snippet testing and validation
- [ ] Google Search Console setup and monitoring
- [ ] Performance monitoring for metadata generation
