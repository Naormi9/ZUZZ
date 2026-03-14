'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Skeleton, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Megaphone } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  boost: 'הגברה',
  highlight: 'הדגשה',
  featured: 'מודעה מובחרת',
  top_of_search: 'ראש תוצאות',
  gallery: 'גלריה',
};

export default function DealerPromotionsPage() {
  const { isAuthenticated } = useAuth();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>('/api/promotions/my');
        setPromotions(res.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  async function cancelPromo(id: string) {
    try {
      await api.patch(`/api/promotions/${id}/cancel`);
      setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">קידום מודעות</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : promotions.length > 0 ? (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <Card key={promo.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {promo.listing?.title || 'מודעה'}
                    </span>
                    <Badge className="text-xs bg-amber-100 text-amber-700">
                      {TYPE_LABELS[promo.type] || promo.type}
                    </Badge>
                    {promo.isActive ? (
                      <Badge className="text-xs bg-green-100 text-green-700">פעיל</Badge>
                    ) : (
                      <Badge className="text-xs bg-gray-100 text-gray-600">לא פעיל</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(promo.startAt).toLocaleDateString('he-IL')} —{' '}
                    {new Date(promo.endAt).toLocaleDateString('he-IL')}
                    {' · '}₪{(promo.amount / 100).toFixed(0)}
                  </p>
                </div>
                {promo.isActive && (
                  <Button size="sm" variant="outline" onClick={() => cancelPromo(promo.id)}>
                    ביטול
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">אין קידומים פעילים</p>
          <p className="text-sm mt-1">קדמו מודעות כדי לקבל יותר חשיפה וצפיות</p>
        </div>
      )}
    </div>
  );
}
