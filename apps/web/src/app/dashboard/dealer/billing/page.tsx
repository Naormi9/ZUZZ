'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { CreditCard } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  free: 'חינם', basic: 'בסיסי', pro: 'מקצועי', enterprise: 'ארגוני',
};

export default function DealerBillingPage() {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: any }>('/api/subscriptions/my');
        setSubscription(res.data);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">מנוי וחשבון</h1>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : subscription ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">התוכנית הנוכחית</h2>
              <Badge className="text-sm bg-brand-100 text-brand-700">
                {PLAN_LABELS[subscription.plan] || subscription.plan}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">סטטוס</p>
                <p className="font-medium">{subscription.status === 'active' ? 'פעיל' : subscription.status}</p>
              </div>
              <div>
                <p className="text-gray-500">תוקף</p>
                <p className="font-medium">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString('he-IL')} —{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('he-IL')}
                </p>
              </div>
              {subscription.organization && (
                <div className="col-span-2">
                  <p className="text-gray-500">ארגון</p>
                  <p className="font-medium">{subscription.organization.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">אין מנוי פעיל</h2>
            <p className="text-gray-500 mb-4">
              כרגע אתם בתוכנית חינם. לשדרוג ויכולות נוספות, פנו אלינו.
            </p>
            <Link href="/contact">
              <Button variant="outline">צור קשר</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">תוכניות זמינות</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { plan: 'basic', label: 'בסיסי', price: '₪99/חודש', features: ['עד 20 מודעות', 'ניהול לידים', 'דף סוחר'] },
            { plan: 'pro', label: 'מקצועי', price: '₪249/חודש', features: ['עד 100 מודעות', 'CRM מתקדם', 'קידום כלול', 'צוות עד 5'] },
            { plan: 'enterprise', label: 'ארגוני', price: 'בהתאמה אישית', features: ['מודעות ללא הגבלה', 'API גישה', 'צוות ללא הגבלה', 'תמיכה ייעודית'] },
          ].map((tier) => (
            <Card key={tier.plan} className="hover:border-brand-300 transition-colors">
              <CardContent className="p-5">
                <h3 className="font-bold text-gray-900">{tier.label}</h3>
                <p className="text-2xl font-bold text-brand-500 mt-1">{tier.price}</p>
                <ul className="mt-4 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          לשדרוג תוכנית, פנו אלינו דרך <Link href="/contact" className="text-brand-600 hover:underline">צור קשר</Link>.
        </p>
      </div>
    </div>
  );
}
