import { Search } from 'lucide-react';
import { Button, Card, CardContent, TrustBadge, ListingCard, Skeleton } from '@zuzz/ui';
import Link from 'next/link';

const verticals = [
  {
    title: 'רכב',
    description: 'מכוניות, אופנועים וכלי רכב מסחריים עם דירוג אמון מובנה',
    href: '/cars',
    icon: '🚗',
    color: 'bg-brand-50 hover:bg-brand-100 border-brand-200',
  },
  {
    title: 'נדל"ן',
    description: 'דירות, בתים ונכסים מסחריים עם אימות בעלות',
    href: '/homes',
    icon: '🏠',
    color: 'bg-green-50 hover:bg-green-100 border-green-200',
  },
  {
    title: 'שוק',
    description: 'מוצרי יד שנייה, אלקטרוניקה, ריהוט ועוד',
    href: '/market',
    icon: '🛒',
    color: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
] as const;

const trustFeatures = [
  {
    title: 'אימות זהות',
    description: 'כל מוכר עובר תהליך אימות לפני פרסום',
    icon: '🛡️',
  },
  {
    title: 'דירוג אמון',
    description: 'ציון אמון מבוסס נתונים אמיתיים, לא ביקורות מזויפות',
    icon: '⭐',
  },
  {
    title: 'מסמכים מאומתים',
    description: 'העלאת מסמכים ואימותם מובנה בכל עסקה',
    icon: '📄',
  },
  {
    title: 'תמיכה בעסקה',
    description: 'ליווי מהפרסום ועד סגירת העסקה',
    icon: '🤝',
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-black to-brand-charcoal text-white">
        <div className="container-app py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">ZUZZ</h1>
            <p className="mt-4 text-xl text-brand-cream sm:text-2xl">המקום שבו עסקאות זזות באמת</p>
            <p className="mt-2 text-base text-gray-400">
              פלטפורמת המסחר המובילה בישראל — עם תשתית אמון מובנית
            </p>

            {/* Search Bar */}
            <div className="mt-10">
              <form action="/cars/search" className="relative mx-auto max-w-2xl">
                <div className="flex items-center overflow-hidden rounded-xl bg-white shadow-lg">
                  <input
                    type="text"
                    name="q"
                    placeholder="חפש רכב, דירה, או כל דבר אחר..."
                    className="flex-1 px-6 py-4 text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="m-2 flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                  >
                    <Search className="h-4 w-4" />
                    <span>חיפוש</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Vertical Cards */}
      <section className="section-spacing">
        <div className="container-app">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            מה מחפשים היום?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {verticals.map((vertical) => (
              <Link key={vertical.href} href={vertical.href}>
                <Card className={`cursor-pointer border-2 transition-all ${vertical.color}`}>
                  <CardContent className="p-8 text-center">
                    <span className="text-5xl">{vertical.icon}</span>
                    <h3 className="mt-4 text-xl font-bold text-gray-900">{vertical.title}</h3>
                    <p className="mt-2 text-sm text-gray-600">{vertical.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="section-spacing bg-gray-50">
        <div className="container-app">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">מודעות מובחרות</h2>
            <Link
              href="/cars/search"
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              הצג הכל ←
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Skeleton placeholders for featured listings */}
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                  <Skeleton className="mt-3 h-6 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">מודעות מובחרות יופיעו כאן בקרוב</p>
        </div>
      </section>

      {/* Trust Messaging */}
      <section className="section-spacing">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">למה ZUZZ?</h2>
            <p className="mt-3 text-gray-600">
              אנחנו לא רק לוח מודעות. אנחנו פלטפורמת עסקאות עם תשתית אמון אמיתית.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustFeatures.map((feature) => (
              <div key={feature.title} className="text-center">
                <span className="text-4xl">{feature.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-500 py-16 text-white">
        <div className="container-app text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">מוכנים להתחיל?</h2>
          <p className="mt-3 text-brand-100">פרסמו מודעה תוך דקות וקבלו חשיפה לקהל הנכון</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/cars/create">
              <Button
                variant="outline"
                className="border-white bg-white text-brand-700 hover:bg-brand-50"
              >
                פרסם מודעה חינם
              </Button>
            </Link>
            <Link href="/cars/search">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                עיין במודעות
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
