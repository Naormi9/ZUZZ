'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Input } from '@zuzz/ui';
import { api, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Upload, X, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { label: 'אלקטרוניקה', value: 'electronics' },
  { label: 'ריהוט', value: 'furniture' },
  { label: 'אופנה', value: 'fashion' },
  { label: 'ספורט', value: 'sports' },
  { label: 'גינה', value: 'garden' },
  { label: 'ילדים', value: 'kids' },
  { label: 'חיות מחמד', value: 'pets' },
  { label: 'ספרים', value: 'books' },
  { label: 'מוזיקה', value: 'music' },
  { label: 'אספנות', value: 'collectibles' },
  { label: 'כלי עבודה', value: 'tools' },
  { label: 'אחר', value: 'other' },
];

const CONDITIONS = [
  { label: 'חדש', value: 'new' },
  { label: 'כמו חדש', value: 'like_new' },
  { label: 'מצב טוב', value: 'good' },
  { label: 'סביר', value: 'fair' },
  { label: 'לחלקים', value: 'for_parts' },
];

interface MediaItem {
  id: string;
  url: string;
  order: number;
}

export default function MarketCreatePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [city, setCity] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">יש להתחבר כדי לפרסם מודעה</h1>
        <Button onClick={() => router.push('/auth/login')}>התחברות</Button>
      </div>
    );
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'listing');

        const res = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setMedia((prev) => [
            ...prev,
            { id: data.data.id, url: data.data.url, order: prev.length },
          ]);
        }
      }
    } catch {
      setError('שגיאה בהעלאת תמונה');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!title.trim()) return setError('יש למלא כותרת');
    if (!category) return setError('יש לבחור קטגוריה');
    if (!condition) return setError('יש לבחור מצב המוצר');
    if (!price || isNaN(Number(price))) return setError('יש למלא מחיר תקין');

    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ data: { id: string } }>('/api/listings', {
        vertical: 'market',
        title: title.trim(),
        description: description.trim() || undefined,
        priceAmount: Number(price),
        priceCurrency: 'ILS',
        isNegotiable,
        city: city.trim() || undefined,
        marketDetails: { category, condition, brand: brand.trim() || undefined },
        mediaIds: media.map((m) => m.id),
      });
      router.push(`/market/${res.data.id}`);
    } catch {
      setError('שגיאה ביצירת המודעה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">פרסום מודעה בשוק</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="מה אתה מוכר?"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="תאר את המוצר..."
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  rows={4}
                  maxLength={2000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category & Condition */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                >
                  <option value="">בחר קטגוריה</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מצב המוצר</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                >
                  <option value="">בחר מצב</option>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מותג (אופציונלי)</label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="למשל: Apple, Samsung..."
                  maxLength={50}
                />
              </div>
            </CardContent>
          </Card>

          {/* Price & Location */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מחיר (₪)</label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="rounded"
                />
                ניתן למשא ומתן
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="למשל: תל אביב"
                  maxLength={50}
                />
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardContent className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">תמונות</label>
              <div className="grid grid-cols-3 gap-2">
                {media.map((m, i) => (
                  <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {media.length < 10 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-400 mt-1">הוסף תמונה</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'מפרסם...' : 'פרסם מודעה'}
          </Button>
        </div>
      </div>
    </div>
  );
}
