'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Users, Phone, Mail } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  new: 'חדש',
  contacted: 'פנו',
  qualified: 'מתאים',
  converted: 'הומר',
  lost: 'אבד',
};
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-brand-100 text-brand-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-green-100 text-green-700',
  converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-gray-100 text-gray-700',
};

export default function DealerLeadsPage() {
  const { isAuthenticated } = useAuth();
  const [orgId, setOrgId] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadOrg() {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>('/api/organizations/my');
        if (res.data[0]) setOrgId(res.data[0].id);
      } catch {
        /* ignore */
      }
    }
    loadOrg();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!orgId) return;
    async function loadLeads() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ pageSize: '50' });
        if (statusFilter) params.set('status', statusFilter);
        const res = await api.get<{ success: boolean; data: { data: any[]; total: number } }>(
          `/api/organizations/${orgId}/leads?${params}`,
        );
        setLeads(res.data.data);
        setTotal(res.data.total);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, [orgId, statusFilter]);

  async function updateStatus(leadId: string, status: string) {
    try {
      await api.patch(`/api/leads/${leadId}/status`, { status });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול לידים</h1>
          <p className="text-gray-500 text-sm">{total} לידים סה&quot;כ</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'new', 'contacted', 'qualified', 'converted', 'lost'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s ? STATUS_LABELS[s] || s : 'הכל'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : leads.length > 0 ? (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {lead.buyer?.name || 'לא ידוע'}
                      </span>
                      <Badge className={`text-xs ${STATUS_COLORS[lead.status] || 'bg-gray-100'}`}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </Badge>
                      <Badge className="text-xs bg-gray-100 text-gray-600">{lead.type}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      עבור:{' '}
                      <Link
                        href={`/cars/${lead.listing?.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {lead.listing?.title}
                      </Link>
                    </p>
                    {lead.message && (
                      <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded p-2">
                        {lead.message}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.buyer?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.buyer.email}
                        </span>
                      )}
                      <span>{new Date(lead.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {lead.status === 'new' && (
                      <Button size="sm" onClick={() => updateStatus(lead.id, 'contacted')}>
                        סמן כטופל
                      </Button>
                    )}
                    {lead.status === 'contacted' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(lead.id, 'qualified')}
                      >
                        מתאים
                      </Button>
                    )}
                    {['new', 'contacted', 'qualified'].includes(lead.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => updateStatus(lead.id, 'lost')}
                      >
                        סגור
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">אין לידים</p>
          <p className="text-sm mt-1">כשמישהו ישאיר פרטים במודעות שלכם, זה יופיע כאן</p>
        </div>
      )}
    </div>
  );
}
