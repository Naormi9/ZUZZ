'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Input } from '@zuzz/ui';
import { useAuth } from '@/lib/hooks/use-auth';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestOtp, register, verifyOtp, devLogin } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await requestOtp(email);
      setMode('verify');
    } catch (e: any) {
      setError(e.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      await register(name, email);
      setMode('verify');
    } catch (e: any) {
      setError(e.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await verifyOtp(email, code);
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message || 'קוד שגוי');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await devLogin(email);
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message || 'שגיאה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <img
              src="/brand/logo-mark.svg"
              alt="ZUZZ"
              className="h-10 mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <h1 className="hidden text-2xl font-bold text-brand-500">ZUZZ</h1>
            <p className="text-gray-500 mt-1">
              {mode === 'verify' ? 'הזן את הקוד שנשלח לאימייל' : mode === 'register' ? 'הרשמה' : 'התחברות'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
          )}

          {mode === 'verify' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">קוד נשלח אל <strong>{email}</strong></p>
              <Input label="קוד אימות" placeholder="123456" value={code} onChange={e => setCode(e.target.value)} maxLength={6} className="text-center text-lg tracking-wider" />
              <Button className="w-full" onClick={handleVerify} loading={loading}>אימות</Button>
              <button onClick={() => setMode('login')} className="text-sm text-brand-700 hover:underline w-full text-center">
                חזרה
              </button>
            </div>
          ) : mode === 'register' ? (
            <div className="space-y-4">
              <Input label="שם מלא" placeholder="ישראל ישראלי" value={name} onChange={e => setName(e.target.value)} />
              <Input label="אימייל" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" />
              <Button className="w-full" onClick={handleRegister} loading={loading}>הרשמה</Button>
              <p className="text-sm text-center text-gray-500">
                כבר רשום?{' '}
                <button onClick={() => setMode('login')} className="text-brand-500 hover:underline">התחבר</button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input label="אימייל" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" />
              <Button className="w-full" onClick={handleLogin} loading={loading}>שלח קוד אימות</Button>
              <Button className="w-full" variant="ghost" onClick={handleDevLogin} loading={loading}>כניסה מהירה (פיתוח)</Button>
              <p className="text-sm text-center text-gray-500">
                אין חשבון?{' '}
                <button onClick={() => setMode('register')} className="text-brand-500 hover:underline">הרשם עכשיו</button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
