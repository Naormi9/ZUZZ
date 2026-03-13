'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@zuzz/ui';
import { Button } from '@zuzz/ui';
import { Card, CardContent } from '@zuzz/ui';
import { Input } from '@zuzz/ui';
import { Skeleton } from '@zuzz/ui';
import { adminApi } from '@/lib/api';

interface ModerationItem {
  id: string;
  title: string;
  category: string;
  user: { name: string };
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  createdAt: string;
  imageUrl?: string;
}

type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

const statusLabels: Record<ModerationStatus, string> = {
  pending: 'ממתין',
  approved: 'מאושר',
  rejected: 'נדחה',
  flagged: 'מסומן',
};

const statusColors: Record<ModerationStatus, string> = {
  pending: 'admin-badge-warning',
  approved: 'admin-badge-success',
  rejected: 'admin-badge-danger',
  flagged: 'admin-badge-info',
};

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModerationStatus>('pending');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectReasonId, setRejectReasonId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getModerationQueue({ status: activeTab, pageSize: 50 });
      setItems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת תור המודרציה');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAction = async (
    itemId: string,
    action: 'approve' | 'reject' | 'request_changes',
    reason?: string
  ) => {
    setActioningId(itemId);
    try {
      await adminApi.moderateItem(itemId, action, reason);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setRejectReasonId(null);
      setRejectReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בביצוע הפעולה');
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
        <h1 className="text-3xl font-bold text-gray-900">מודרציה</h1>
        <p className="mt-1 text-gray-500">אישור, דחייה ובקרת מודעות</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ModerationStatus)}>
        <TabsList>
          <TabsTrigger value="pending">ממתינים</TabsTrigger>
          <TabsTrigger value="approved">מאושרים</TabsTrigger>
          <TabsTrigger value="rejected">נדחו</TabsTrigger>
          <TabsTrigger value="flagged">מסומנים</TabsTrigger>
        </TabsList>

        {(['pending', 'approved', 'rejected', 'flagged'] as const).map((status) => (
          <TabsContent key={status} value={status}>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : items.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-500">
                  אין פריטים בסטטוס {statusLabels[status]}
                </div>
              ) : (
                items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.title}
                            </h3>
                            <span className={`admin-badge ${statusColors[item.status]}`}>
                              {statusLabels[item.status]}
                            </span>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>סוג: {item.category}</span>
                            <span>מפרסם: {item.user?.name}</span>
                            <span>הוגש: {formatDate(item.createdAt)}</span>
                          </div>
                        </div>

                        {activeTab === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={actioningId === item.id}
                              onClick={() => handleAction(item.id, 'approve')}
                            >
                              {actioningId === item.id ? 'מעבד...' : 'אשר'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actioningId === item.id}
                              onClick={() =>
                                setRejectReasonId(
                                  rejectReasonId === item.id ? null : item.id
                                )
                              }
                            >
                              דחה
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actioningId === item.id}
                              onClick={() => handleAction(item.id, 'request_changes')}
                            >
                              בקש שינויים
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Reject reason input */}
                      {rejectReasonId === item.id && (
                        <div className="mt-4 flex gap-2">
                          <Input
                            placeholder="סיבת הדחייה..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={!rejectReason.trim() || actioningId === item.id}
                            onClick={() => handleAction(item.id, 'reject', rejectReason)}
                          >
                            אשר דחייה
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRejectReasonId(null);
                              setRejectReason('');
                            }}
                          >
                            ביטול
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
