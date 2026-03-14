import Link from 'next/link';
import { breadcrumbJsonLd, type BreadcrumbItem } from '@/lib/json-ld';
import { JsonLd } from './json-ld';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Renders visible breadcrumb nav + BreadcrumbList JSON-LD.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="breadcrumb" className="text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1">
              {i > 0 && <span className="mx-1 text-gray-300">/</span>}
              {i < items.length - 1 ? (
                <Link
                  href={item.href}
                  className="hover:text-gray-700 transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
