'use client';

import Link from 'next/link';

const footerSections = [
  {
    title: 'רכב',
    links: [
      { label: 'כל הרכבים', href: '/cars' },
      { label: 'חיפוש רכבים', href: '/cars/search' },
      { label: 'טויוטה', href: '/cars/search?make=%D7%98%D7%95%D7%99%D7%95%D7%98%D7%94' },
      { label: 'יונדאי', href: '/cars/search?make=%D7%99%D7%95%D7%A0%D7%93%D7%90%D7%99' },
      { label: 'קיה', href: '/cars/search?make=%D7%A7%D7%99%D7%94' },
      { label: 'רכבים חשמליים', href: '/cars/search?fuelType=electric' },
    ],
  },
  {
    title: 'נדל"ן ושוק',
    links: [
      { label: 'דירות למכירה', href: '/homes' },
      { label: 'חיפוש נכסים', href: '/homes/search' },
      { label: 'ZUZZ Market', href: '/market' },
    ],
  },
  {
    title: 'ZUZZ',
    links: [
      { label: 'אודות', href: '/about' },
      { label: 'צור קשר', href: '/contact' },
      { label: 'בטיחות ואמון', href: '/trust' },
      { label: 'מדריך קניית רכב', href: '/guides/buying-car' },
      { label: 'מדריך מכירת רכב', href: '/guides/selling-car' },
    ],
  },
  {
    title: 'תמיכה ומידע',
    links: [
      { label: 'תנאי שימוש', href: '/terms' },
      { label: 'מדיניות פרטיות', href: '/privacy' },
      { label: 'נגישות', href: '/accessibility' },
      { label: 'פרסם מודעה', href: '/cars/create' },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 pb-24 sm:pb-8">
      <div className="container-app py-12">
        {/* Footer Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <img
                src="/brand/logo-mark.svg"
                alt="ZUZZ"
                className="h-8 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className="hidden text-2xl font-bold text-brand-black">ZUZZ</span>
            </Link>
            <p className="mt-3 text-sm text-gray-600">
              המקום שבו עסקאות זזות באמת
            </p>
            <p className="mt-1 text-xs text-gray-400">
              פלטפורמת המסחר המובילה בישראל — רכב, נדל&quot;ן ושוק עם תשתית אמון מובנית.
            </p>
          </div>

          {/* Link Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} ZUZZ. כל הזכויות שמורות.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              תנאי שימוש
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              פרטיות
            </Link>
            <Link
              href="/accessibility"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              נגישות
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
