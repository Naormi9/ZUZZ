'use client';

import { useEffect, useState } from 'react';
import { Button, Spinner, EmptyState } from '@zuzz/ui';
import { api } from '@/lib/api';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: { data: any[] } }>('/api/favorites')
      .then(res => setFavorites(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">המועדפים שלי</h1>
      {favorites.length === 0 ? (
        <EmptyState title="אין מועדפים עדיין" description="שמור מודעות שמעניינות אותך כדי למצוא אותן בקלות" action={<Button onClick={() => window.location.href = '/cars/search'}>חפש רכבים</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((listing) => (
            <a key={listing.id} href={`/${listing.vertical === 'cars' ? 'cars' : listing.vertical}/${listing.id}`} className="block border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-gray-100">
                {listing.media?.[0] && <img src={listing.media[0].url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="font-bold text-blue-600">₪{listing.priceAmount?.toLocaleString()}</div>
                <h3 className="text-sm font-medium mt-1 line-clamp-2">{listing.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{listing.city}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
