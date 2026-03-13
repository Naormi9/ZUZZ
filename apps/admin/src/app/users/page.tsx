'use client';

import { useEffect, useState, useCallback } from 'react';
import { Input } from '@zuzz/ui';
import { Badge } from '@zuzz/ui';
import { Button } from '@zuzz/ui';
import { Skeleton } from '@zuzz/ui';
import { adminApi, type User } from '@/lib/api';

const statusLabels: Record<User['status'], string> = {
  active: 'פעיל',
  inactive: 'לא פעיל',
  banned: 'חסום',
};

const statusColors: Record<User['status'], string> = {
  active: 'admin-badge-success',
  inactive: 'admin-badge-neutral',
  banned: 'admin-badge-danger',
};

const roleLabels: Record<string, string> = {
  admin: 'מנהל',
  moderator: 'מודרטור',
  dealer: 'סוכן',
  user: 'משתמש',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getUsers({ search, page, limit: 20 });
      setUsers(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת משתמשים');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (userId: string) => {
    setTogglingId(userId);
    try {
      const updatedUser = await adminApi.toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון סטטוס');
    } finally {
      setTogglingId(null);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">משתמשים</h1>
        <p className="mt-1 text-gray-500">ניהול משתמשי הפלטפורמה</p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          type="search"
          placeholder="חיפוש לפי שם או אימייל..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
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
              <th>אימייל</th>
              <th>תפקידים</th>
              <th>מודעות</th>
              <th>סטטוס</th>
              <th>הצטרף</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}>
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              : users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium text-gray-900">{user.name}</td>
                    <td className="text-gray-600" dir="ltr">
                      {user.email}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {roleLabels[role] || role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="text-gray-600">
                      {new Intl.NumberFormat('he-IL').format(user.listingsCount)}
                    </td>
                    <td>
                      <span className={`admin-badge ${statusColors[user.status]}`}>
                        {statusLabels[user.status]}
                      </span>
                    </td>
                    <td className="text-gray-600">{formatDate(user.createdAt)}</td>
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={togglingId === user.id || user.status === 'banned'}
                        onClick={() => handleToggleStatus(user.id)}
                      >
                        {togglingId === user.id
                          ? 'מעדכן...'
                          : user.status === 'active'
                            ? 'השבת'
                            : 'הפעל'}
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && users.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            לא נמצאו משתמשים
          </div>
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
