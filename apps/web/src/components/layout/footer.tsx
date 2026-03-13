import Link from 'next/link';

const footerSections = [
  {
    title: 'קטגוריות',
    links: [
      { label: 'רכב', href: '/cars' },
      { label: 'נדל"ן', href: '/homes' },
      { label: 'שוק', href: '/market' },
    ],
  },
  {
    title: 'ZUZZ',
    links: [
      { label: 'אודות', href: '/about' },
      { label: 'צור קשר', href: '/contact' },
      { label: 'בלוג', href: '/blog' },
      { label: 'דרושים', href: '/careers' },
    ],
  },
  {
    title: 'תמיכה',
    links: [
      { label: 'מרכז עזרה', href: '/help' },
      { label: 'בטיחות ואמון', href: '/trust' },
      { label: 'תנאי שימוש', href: '/terms' },
      { label: 'מדיניות פרטיות', href: '/privacy' },
    ],
  },
  {
    title: 'למפרסמים',
    links: [
      { label: 'פרסם מודעה', href: '/cars/create' },
      { label: 'פורטל סוחרים', href: '/cars' },
      { label: 'חבילות קידום', href: '/cars' },
      { label: 'מנויים עסקיים', href: '/cars' },
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
              <span className="text-2xl font-bold text-brand-600">ZUZZ</span>
            </Link>
            <p className="mt-3 text-sm text-gray-600">
              המקום שבו עסקאות זזות באמת
            </p>
            <p className="mt-1 text-xs text-gray-400">
              פלטפורמת המסחר המובילה בישראל
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
                  <li key={link.href}>
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
