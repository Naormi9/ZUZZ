'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Skeleton, Input, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Settings } from 'lucide-react';

export default function DealerSettingsPage() {
  const { isAuthenticated } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    city: '',
    region: '',
    address: '',
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>('/api/organizations/my');
        const myOrg = res.data[0];
        if (myOrg) {
          setOrg(myOrg);
          setForm({
            name: myOrg.name || '',
            description: myOrg.description || '',
            phone: myOrg.phone || '',
            email: myOrg.email || '',
            website: myOrg.website || '',
            city: myOrg.city || '',
            region: myOrg.region || '',
            address: myOrg.address || '',
          });
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  async function save() {
    if (!org) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.patch(`/api/organizations/${org.id}`, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (!org) return <div className="text-center py-16 text-gray-500">אין ארגון</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">הגדרות ארגון</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם הארגון</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">דוא&quot;ל</label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אתר אינטרנט</label>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אזור</label>
              <Input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כתובת</label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? 'שומר...' : 'שמור שינויים'}
            </Button>
            {saved && <span className="text-sm text-green-600">נשמר בהצלחה</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
