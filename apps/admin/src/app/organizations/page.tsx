'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@zuzz/ui';
import { Button } from '@zuzz/ui';
import { Skeleton } from '@zuzz/ui';
import { adminApi, type Organization } from '@/lib/api';

const typeLabels: Record<string, string> = {
  dealer: 'סוכנות רכב',
  agency: 'סוכנות נדל"ן',
  developer: 'יזם',
  business: 'עסק',
};

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getOrganizations({ page, limit: 20 });
      setOrganizations(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת ארגונים');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ארגונים</h1>
        <p className="mt-1 text-gray-500">ניהול ארגונים, סוכנויות ועסקים</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="admin-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>סוג</th>
              <th>חברים</th>
              <th>מודעות</th>
              <th>מאומת</th>
              <th>הצטרף</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              : organizations.map((org) => (
                  <tr key={org.id}>
                    <td className="font-medium text-gray-900">{org.name}</td>
                    <td>
                      <Badge variant="secondary">
                        {typeLabels[org.type] || org.type}
                      </Badge>
                    </td>
                    <td className="text-gray-600">
                      {new Intl.NumberFormat('he-IL').format(org.membersCount)}
                    </td>
                    <td className="text-gray-600">
                      {new Intl.NumberFormat('he-IL').format(org.listingsCount)}
                    </td>
                    <td>
                      {org.verified ? (
                        <span className="admin-badge admin-badge-success">מאומת</span>
                      ) : (
                        <span className="admin-badge admin-badge-neutral">לא מאומת</span>
                      )}
                    </td>
                    <td className="text-gray-600">{formatDate(org.createdAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && organizations.length === 0 && (
          <div className="py-12 text-center text-gray-500">אין ארגונים</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            הקודם
          </Button>
          <span className="text-sm text-gray-600">
            עמוד {page} מתוך {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            הבא
          </Button>
        </div>
      )}
    </div>
  );
}
