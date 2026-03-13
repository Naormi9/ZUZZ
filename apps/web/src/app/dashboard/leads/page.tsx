'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Badge } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Users, Phone, Mail, MessageCircle } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  new: 'חדש', contacted: 'פנו', qualified: 'מתאים', converted: 'הומר', lost: 'אבד',
};
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700', contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-green-100 text-green-700', converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-gray-100 text-gray-700',
};

export default function LeadsPage() {
  const { isAuthenticated } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>('/api/leads');
        setLeads(res.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  async function updateStatus(leadId: string, status: string) {
    try {
      await api.patch(`/api/leads/${leadId}/status`, { status });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch {
      // ignore
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">יש להתחבר</h1>
          <Link href="/auth/login"><Button>התחברות</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">לידים</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : leads.length > 0 ? (
        <div className="space-y-3">
          {leads.map(lead => (
            <Card key={lead.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{lead.buyer?.name}</span>
                      <Badge className={`text-xs ${STATUS_COLORS[lead.status] || 'bg-gray-100'}`}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      עבור: {lead.listing?.title}
                    </p>
                    {lead.message && <p className="text-sm text-gray-700 mt-2">{lead.message}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                      {lead.buyer?.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.buyer.email}</span>}
                      <span>{new Date(lead.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {lead.status === 'new' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(lead.id, 'contacted')}>
                        סמן כטופל
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
          <p className="font-medium">אין לידים עדיין</p>
          <p className="text-sm mt-1">כשמישהו ישאיר פרטים במודעה שלך, זה יופיע כאן</p>
        </div>
      )}
    </div>
  );
}
