'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Bell, MessageCircle, Heart, Search, TrendingDown, Megaphone, CheckCheck } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  new_message: MessageCircle,
  new_lead: Heart,
  saved_search_match: Search,
  price_drop: TrendingDown,
  promotion_activated: Megaphone,
  listing_status_change: Bell,
  system: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  new_message: 'bg-blue-50 text-blue-600',
  new_lead: 'bg-emerald-50 text-emerald-600',
  saved_search_match: 'bg-brand-50 text-brand-600',
  price_drop: 'bg-amber-50 text-amber-600',
  promotion_activated: 'bg-purple-50 text-purple-600',
  listing_status_change: 'bg-gray-50 text-gray-600',
  system: 'bg-gray-50 text-gray-600',
};

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const res = await api.get<{
          success: boolean;
          data: { data: NotificationItem[]; unreadCount: number };
        }>('/api/notifications?pageSize=50');
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  async function markAllRead() {
    try {
      await api.post('/api/notifications/read-all', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // fail silently
    }
  }

  async function markRead(id: string) {
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // fail silently
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">יש להתחבר</h1>
          <Link href="/auth/login">
            <Button>התחברות</Button>
          </Link>
        </div>
      </div>
    );
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'עכשיו';
    if (diffMin < 60) return `לפני ${diffMin} דקות`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `לפני ${diffHour} שעות`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `לפני ${diffDay} ימים`;
    return date.toLocaleDateString('he-IL');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-black tracking-tight">התראות</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} לא נקראו</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-4 w-4" />
            סמן הכל כנקרא
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const IconComponent = TYPE_ICONS[notification.type] || Bell;
            const colorClass = TYPE_COLORS[notification.type] || 'bg-gray-50 text-gray-600';

            const content = (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                  notification.isRead
                    ? 'border-gray-100 bg-white'
                    : 'border-brand-100 bg-brand-50/30'
                } hover:bg-gray-50`}
                onClick={() => {
                  if (!notification.isRead) markRead(notification.id);
                }}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${notification.isRead ? 'text-gray-700' : 'text-brand-black font-semibold'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
                </div>
                {!notification.isRead && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-brand-500 mt-2" />
                )}
              </div>
            );

            return notification.link ? (
              <Link key={notification.id} href={notification.link}>
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Bell className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-brand-black mb-2">אין התראות</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            התראות יופיעו כאן כשיהיו הודעות חדשות, לידים, ירידות מחיר ועוד.
          </p>
        </div>
      )}
    </div>
  );
}
