import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, buildMetadata } from '@/lib/seo';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface OrgApiResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    logoUrl: string | null;
    city: string | null;
    region: string | null;
    verificationStatus: string;
    _count: { listings: number };
  };
}

async function fetchOrg(id: string): Promise<OrgApiResponse['data'] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/organizations/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json: OrgApiResponse = await res.json();
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
  const org = await fetchOrg(id);

  if (!org) {
    return {
      title: 'סוחר רכב | ZUZZ',
      description: 'צפה בפרופיל סוחר ב-ZUZZ',
    };
  }

  const locationParts = [org.city, org.region].filter(Boolean);
  const location = locationParts.length > 0 ? ` ב${locationParts.join(', ')}` : '';
  const title = `${org.name} — סוחר רכב${location}`;
  const description = org.description
    ? `${org.name}${location}. ${org.description}. ${org._count.listings} מודעות פעילות ב-ZUZZ.`
    : `${org.name}${location} — ${org._count.listings} מודעות רכב למכירה ב-ZUZZ. סוחר מאומת עם ציון אמון.`;

  const imageUrl = org.logoUrl ?? `${SITE_URL}${DEFAULT_OG_IMAGE}`;

  return buildMetadata({
    title,
    description,
    path: `/dealers/${id}`,
    image: imageUrl,
  });
}

export default function DealerProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
