'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@zuzz/ui';
import { Skeleton } from '@zuzz/ui';
import { adminApi, type FeatureFlag } from '@/lib/api';

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getFeatureFlags()
      .then(setFlags)
      .catch((err) => setError(err instanceof Error ? err.message : 'שגיאה בטעינת דגלי פיצ\'רים'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (flagId: string, currentEnabled: boolean) => {
    setTogglingId(flagId);
    try {
      const updated = await adminApi.toggleFeatureFlag(flagId, currentEnabled);
      setFlags((prev) => prev.map((f) => (f.id === flagId ? updated : f)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון דגל');
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
        <p className="mt-1 text-gray-500">ניהול דגלי פיצ'רים של הפלטפורמה</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Flags List */}
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </CardContent>
              </Card>
            ))
          : flags.map((flag) => (
              <Card key={flag.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{flag.name}</h3>
                        <span
                          className={`admin-badge ${
                            flag.isEnabled ? 'admin-badge-success' : 'admin-badge-neutral'
                          }`}
                        >
                          {flag.isEnabled ? 'פעיל' : 'כבוי'}
                        </span>
                      </div>
                      {flag.key && (
                        <p className="font-mono text-xs text-gray-400">{flag.key}</p>
                      )}
                      <p className="text-sm text-gray-500">{flag.description}</p>
                      <p className="text-xs text-gray-400">
                        עודכן לאחרונה: {formatDate(flag.updatedAt)}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={flag.isEnabled}
                      disabled={togglingId === flag.id}
                      onClick={() => handleToggle(flag.id, flag.isEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        flag.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          flag.isEnabled ? '-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}

        {!loading && flags.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-500">
            אין דגלי פיצ'רים מוגדרים
          </div>
        )}
      </div>
    </div>
  );
}
