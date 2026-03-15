'use client';

import { useCompare } from '@/lib/hooks/use-compare';
import { Button } from '@zuzz/ui';
import { X, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';

export function CompareTray() {
  const { items, count, removeFromCompare, clearCompare } = useCompare();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-14 sm:bottom-4 start-4 end-4 z-40 mx-auto max-w-2xl">
      <div className="rounded-2xl bg-brand-black text-white shadow-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-semibold">השוואה ({count}/3)</span>
          </div>
          <button onClick={clearCompare} className="text-xs text-gray-400 hover:text-white">
            נקה
          </button>
        </div>

        <div className="flex items-center gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative flex-1 min-w-0">
              <div className="rounded-lg bg-white/10 p-2">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-12 object-cover rounded mb-1"
                  />
                )}
                <p className="text-xs font-medium truncate">{item.title}</p>
                <p className="text-xs text-gray-400">₪{item.price.toLocaleString()}</p>
              </div>
              <button
                onClick={() => removeFromCompare(item.id)}
                className="absolute -top-1 -end-1 bg-red-500 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {count >= 2 && (
            <Link href={`/cars/compare?ids=${items.map((i) => i.id).join(',')}`}>
              <Button size="sm" className="flex-shrink-0 bg-brand-500 hover:bg-brand-600">
                השווה
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
