'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, Input } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Building2, ArrowLeft } from 'lucide-react';

export default function DealerOnboardingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'dealer' as string,
    description: '',
    phone: '',
    email: '',
    website: '',
    city: '',
    region: '',
    address: '',
    licenseNumber: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name || !form.type) {
      setError('שם ארגון וסוג נדרשים');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/organizations', form);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'שגיאה ביצירת הארגון');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">יש להתחבר כדי לפתוח חשבון עסקי</h1>
          <Link href="/auth/login"><Button>התחברות</Button></Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">הבקשה נשלחה בהצלחה!</h1>
            <p className="text-gray-600 mb-6">
              הבקשה שלכם ממתינה לאישור. תקבלו הודעה כשהחשבון יאושר.
            </p>
            <Link href="/dashboard/dealer">
              <Button>לפורטל הסוחר</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">פתיחת חשבון עסקי</h1>
        <p className="text-gray-600">הצטרף כסוחר ב-ZUZZ ונהל את המלאי, הלידים והמודעות שלך.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">פרטי העסק</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם העסק *</label>
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="שם החברה או העסק" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג עסק *</label>
              <select
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="dealer">סוחר רכב</option>
                <option value="agency">סוכנות נדל&quot;ן</option>
                <option value="developer">יזם נדל&quot;ן</option>
                <option value="business">עסק כללי</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תיאור העסק</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="ספרו על העסק שלכם..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} type="tel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">דוא&quot;ל עסקי</label>
                <Input value={form.email} onChange={(e) => update('email', e.target.value)} type="email" />
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full" disabled={!form.name || !form.type}>
              המשך
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" /> חזרה
            </button>
            <h2 className="text-lg font-semibold">מיקום ופרטים נוספים</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
                <Input value={form.city} onChange={(e) => update('city', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אזור</label>
                <Input value={form.region} onChange={(e) => update('region', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">כתובת</label>
              <Input value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אתר אינטרנט</label>
              <Input value={form.website} onChange={(e) => update('website', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מספר רישיון עסק (אופציונלי)</label>
              <Input value={form.licenseNumber} onChange={(e) => update('licenseNumber', e.target.value)} />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={loading}>
              {loading ? 'שולח...' : 'שלח בקשה'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
