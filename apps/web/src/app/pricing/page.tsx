'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Check } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface Plan {
  id: string;
  nameHe: string;
  price: number;
  popular?: boolean;
  features: string[];
}

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analytics.planView();
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: Plan[] }>('/api/checkout/plans');
        setPlans(res.data);
      } catch {
        // use defaults
        setPlans([
          {
            id: 'free',
            nameHe: 'חינם',
            price: 0,
            features: ['עד 3 מודעות', 'ציון אמון בסיסי', 'הודעות ללא הגבלה'],
          },
          {
            id: 'basic',
            nameHe: 'בסיסי',
            price: 9900,
            features: ['עד 20 מודעות', 'ציון אמון מלא', 'סטטיסטיקות', 'לוגו סוחר'],
          },
          {
            id: 'pro',
            nameHe: 'מקצועי',
            price: 24900,
            popular: true,
            features: ['מודעות ללא הגבלה', 'ציון אמון מלא + תגים', 'סטטיסטיקות מתקדמות', 'ניהול צוות', 'קידום בהנחה'],
          },
          {
            id: 'enterprise',
            nameHe: 'ארגוני',
            price: 49900,
            features: ['הכל ב-Pro', 'API גישה', 'אינטגרציות', 'מנהל לקוח ייעודי', 'SLA'],
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSelectPlan(plan: Plan) {
    analytics.planSelect(plan.id);

    if (plan.id === 'free') return;

    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      analytics.checkoutStart('subscription', plan.price);
      const res = await api.post<{ success: boolean; data: { checkoutUrl: string } }>('/api/checkout/create-session', {
        type: 'subscription',
        plan: plan.id,
        durationMonths: 1,
      });
      window.location.href = res.data.checkoutUrl;
    } catch (err) {
      analytics.checkoutFailure('session_creation_failed');
      alert('שגיאה ביצירת הזמנה. נסה שוב.');
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-black tracking-tighter">
            תוכניות לסוחרים
          </h1>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            בחר את התוכנית שמתאימה לגודל העסק שלך. שדרג בכל עת.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? 'border-brand-500 ring-2 ring-brand-100'
                  : 'border-gray-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 start-4">
                  <Badge className="bg-brand-500 text-white px-3 py-1 text-xs font-semibold">
                    הכי פופולרי
                  </Badge>
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-brand-black">{plan.nameHe}</h3>
                <div className="mt-3 mb-6">
                  {plan.price > 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-brand-black">
                        ₪{(plan.price / 100).toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">/חודש</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-brand-black">חינם</span>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {plan.id === 'free' ? 'התחל חינם' : 'בחר תוכנית'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            כל התוכניות כוללות 14 ימי ניסיון. ניתן לבטל בכל עת.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            מחירים לא כוללים מע&quot;מ
          </p>
        </div>
      </div>
    </div>
  );
}
