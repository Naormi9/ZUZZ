'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@zuzz/ui';
import { Button } from '@zuzz/ui';
import { Skeleton } from '@zuzz/ui';
import { adminApi } from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  type: string;
  verificationStatus: string;
  city: string | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  _count: { listings: number; members: number };
  dealerProfile?: { verified: boolean } | null;
  members?: { user: { name: string; email: string }; role: string }[];
  subscriptions?: { plan: string; status: string }[];
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  dealer: 'סוכנות רכב',
  agency: 'סוכנות נדל"ן',
  developer: 'יזם',
  business: 'עסק',
};

const statusLabels: Record<string, string> = {
  pending: 'ממתין לאישור',
  verified: 'מאומת',
  rejected: 'נדחה',
  suspended: 'מושעה',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-600',
};

const STATUS_FILTERS = [
  { value: '', label: 'הכל' },
  { value: 'pending', label: 'ממתין' },
  { value: 'verified', label: 'מאומת' },
  { value: 'rejected', label: 'נדחה' },
  { value: 'suspended', label: 'מושעה' },
];

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orgs = await adminApi.getOrganizations(
        statusFilter ? { status: statusFilter } : undefined
      ) as Organization[];
      setOrganizations(orgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת ארגונים');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

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

  async function openDetail(orgId: string) {
    setDetailLoading(true);
    try {
      const org = await adminApi.getOrganization(orgId) as Organization;
      setSelectedOrg(org);
    } catch {
      // stay on list
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAction(action: 'approve' | 'reject' | 'suspend' | 'reactivate') {
    if (!selectedOrg) return;
    setActionLoading(action);
    try {
      await adminApi.orgAction(selectedOrg.id, action);
      // Refresh detail
      const org = await adminApi.getOrganization(selectedOrg.id) as Organization;
      setSelectedOrg(org);
      // Refresh list
      fetchOrganizations();
    } catch {
      // ignore
    } finally {
      setActionLoading('');
    }
  }

  if (selectedOrg) {
    const org = selectedOrg;
    const owner = org.members?.find((m) => m.role === 'owner');
    const sub = org.subscriptions?.[0];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedOrg(null)}>
            &larr; חזרה
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          <Badge className={statusColors[org.verificationStatus] || 'bg-gray-100 text-gray-600'}>
            {statusLabels[org.verificationStatus] || org.verificationStatus}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Info card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">פרטי ארגון</h2>
            <div className="text-sm space-y-2">
              <p><span className="text-gray-500">סוג:</span> {typeLabels[org.type] || org.type}</p>
              {org.city && <p><span className="text-gray-500">מיקום:</span> {org.city}{org.region ? `, ${org.region}` : ''}</p>}
              {org.phone && <p><span className="text-gray-500">טלפון:</span> {org.phone}</p>}
              {org.email && <p><span className="text-gray-500">דוא&quot;ל:</span> {org.email}</p>}
              <p><span className="text-gray-500">הצטרף:</span> {formatDate(org.createdAt)}</p>
              <p><span className="text-gray-500">מודעות:</span> {org._count?.listings ?? 0}</p>
              <p><span className="text-gray-500">חברים:</span> {org._count?.members ?? 0}</p>
            </div>
          </div>

          {/* Owner + subscription card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">בעלים ומנוי</h2>
            <div className="text-sm space-y-2">
              {owner && (
                <>
                  <p><span className="text-gray-500">בעלים:</span> {owner.user.name}</p>
                  <p><span className="text-gray-500">אימייל:</span> {owner.user.email}</p>
                </>
              )}
              {sub ? (
                <>
                  <p><span className="text-gray-500">תוכנית:</span> {sub.plan}</p>
                  <p><span className="text-gray-500">סטטוס מנוי:</span> {sub.status === 'active' ? 'פעיל' : sub.status}</p>
                </>
              ) : (
                <p className="text-gray-400">אין מנוי פעיל</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">פעולות</h2>
          <div className="flex flex-wrap gap-3">
            {org.verificationStatus === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleAction('approve')}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'approve' ? 'מאשר...' : 'אשר ארגון'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('reject')}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'reject' ? 'דוחה...' : 'דחה ארגון'}
                </Button>
              </>
            )}
            {org.verificationStatus === 'verified' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('suspend')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'suspend' ? 'משעה...' : 'השעה ארגון'}
              </Button>
            )}
            {(org.verificationStatus === 'suspended' || org.verificationStatus === 'rejected') && (
              <Button
                size="sm"
                onClick={() => handleAction('reactivate')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'reactivate' ? 'מפעיל...' : 'הפעל מחדש'}
              </Button>
            )}
          </div>
        </div>

        {/* Members list */}
        {org.members && org.members.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900 mb-4">חברי צוות</h2>
            <div className="space-y-2">
              {org.members.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-500">{m.user.email}</p>
                  </div>
                  <Badge variant="secondary">{m.role === 'owner' ? 'בעלים' : m.role === 'admin' ? 'מנהל' : 'חבר'}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ארגונים</h1>
        <p className="mt-1 text-gray-500">ניהול ארגונים, סוכנויות ועסקים</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              statusFilter === f.value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
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
              <th>סטטוס</th>
              <th>חברים</th>
              <th>מודעות</th>
              <th>הצטרף</th>
              <th></th>
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
              : organizations.map((org) => (
                  <tr key={org.id}>
                    <td className="font-medium text-gray-900">{org.name}</td>
                    <td>
                      <Badge variant="secondary">
                        {typeLabels[org.type] || org.type}
                      </Badge>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[org.verificationStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[org.verificationStatus] || org.verificationStatus}
                      </span>
                    </td>
                    <td className="text-gray-600">
                      {new Intl.NumberFormat('he-IL').format(org._count?.members ?? 0)}
                    </td>
                    <td className="text-gray-600">
                      {new Intl.NumberFormat('he-IL').format(org._count?.listings ?? 0)}
                    </td>
                    <td className="text-gray-600">{formatDate(org.createdAt)}</td>
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(org.id)}
                        disabled={detailLoading}
                      >
                        פרטים
                      </Button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && organizations.length === 0 && (
          <div className="py-12 text-center text-gray-500">אין ארגונים</div>
        )}
      </div>
    </div>
  );
}
