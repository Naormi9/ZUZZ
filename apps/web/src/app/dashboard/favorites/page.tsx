'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, ListingCard } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: { data: any[] } }>('/api/favorites');
        setFavorites(res.data.data ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">יש להתחבר</h1>
          <Link href="/auth/login"><Button>התחברות</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">המועדפים שלי</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map(listing => (
            <Link key={listing.id} href={`/cars/${listing.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-gray-200">
                  {listing.media?.[0] && (
                    <img src={listing.media[0].url} alt={listing.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">{listing.title}</h3>
                  <p className="text-brand-500 font-bold mt-1">
                    ₪{listing.priceAmount?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{listing.city}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">אין מועדפים עדיין</p>
          <p className="text-sm mt-1">סמן מודעות כמועדפות ותמצא אותן כאן</p>
          <Link href="/cars/search">
            <Button variant="outline" className="mt-4">חפש רכבים</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
