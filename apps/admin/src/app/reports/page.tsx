'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@zuzz/ui';
import { Skeleton } from '@zuzz/ui';
import { adminApi, type Report } from '@/lib/api';

const statusLabels: Record<Report['status'], string> = {
  open: 'פתוח',
  resolved: 'טופל',
  dismissed: 'נדחה',
};

const statusColors: Record<Report['status'], string> = {
  open: 'admin-badge-warning',
  resolved: 'admin-badge-success',
  dismissed: 'admin-badge-neutral',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getReports({ page, limit: 20 });
      setReports(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת דיווחים');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (reportId: string) => {
    setActioningId(reportId);
    try {
      await adminApi.resolveReport(reportId);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' as const } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטיפול בדיווח');
    } finally {
      setActioningId(null);
    }
  };

  const handleDismiss = async (reportId: string) => {
    setActioningId(reportId);
    try {
      await adminApi.dismissReport(reportId);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'dismissed' as const } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בדחיית דיווח');
    } finally {
      setActioningId(null);
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
        <h1 className="text-3xl font-bold text-gray-900">דיווחים</h1>
        <p className="mt-1 text-gray-500">ניהול דיווחי משתמשים על מודעות</p>
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
              <th>מודעה</th>
              <th>סיבה</th>
              <th>מדווח</th>
              <th>סטטוס</th>
              <th>תאריך</th>
              <th>פעולות</th>
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
              : reports.map((report) => (
                  <tr key={report.id}>
                    <td className="font-medium text-gray-900">{report.listingTitle}</td>
                    <td className="max-w-xs truncate text-gray-600">{report.reason}</td>
                    <td className="text-gray-600">{report.reporterName}</td>
                    <td>
                      <span className={`admin-badge ${statusColors[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                    </td>
                    <td className="text-gray-600">{formatDate(report.createdAt)}</td>
                    <td>
                      {report.status === 'open' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={actioningId === report.id}
                            onClick={() => handleResolve(report.id)}
                          >
                            {actioningId === report.id ? 'מעבד...' : 'טפל'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actioningId === report.id}
                            onClick={() => handleDismiss(report.id)}
                          >
                            דחה
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && reports.length === 0 && (
          <div className="py-12 text-center text-gray-500">אין דיווחים</div>
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
