'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@zuzz/ui';
import { CheckCircle } from 'lucide-react';
import { analytics } from '@/lib/analytics';
import { Suspense } from 'react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    if (paymentId) {
      analytics.checkoutSuccess(paymentId, 0);
    }
  }, [paymentId]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-brand-black mb-3 tracking-tight">
          התשלום בוצע בהצלחה!
        </h1>
        <p className="text-gray-500 mb-8">
          ההזמנה שלך הופעלה. תוכל לנהל את המנוי והקידומים מלוח הבקרה.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard/dealer">
            <Button>לוח בקרה</Button>
          </Link>
          <Link href="/dashboard/dealer/promotions">
            <Button variant="outline">ניהול קידומים</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">טוען...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
