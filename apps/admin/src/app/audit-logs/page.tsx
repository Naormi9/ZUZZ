'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@zuzz/ui';
import { Skeleton } from '@zuzz/ui';
import { adminApi, type AuditLog } from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getAuditLogs({ page, limit: 30 });
      setLogs(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת יומן פעולות');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatTimestamp = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">יומן פעולות</h1>
        <p className="mt-1 text-gray-500">צפייה בכל הפעולות שבוצעו במערכת</p>
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
              <th>משתמש</th>
              <th>פעולה</th>
              <th>ישות</th>
              <th>מזהה ישות</th>
              <th>זמן</th>
              <th>פרטים</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              : logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-medium text-gray-900">{log.userName}</td>
                    <td>
                      <span className="admin-badge admin-badge-info">{log.action}</span>
                    </td>
                    <td className="text-gray-600">{log.entity}</td>
                    <td className="font-mono text-xs text-gray-500" dir="ltr">
                      {log.entityId}
                    </td>
                    <td className="text-gray-600">{formatTimestamp(log.timestamp)}</td>
                    <td className="max-w-xs truncate text-sm text-gray-500">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && logs.length === 0 && (
          <div className="py-12 text-center text-gray-500">אין רשומות ביומן</div>
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
