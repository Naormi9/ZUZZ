'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Skeleton, Badge, Input } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { Users, UserPlus, Trash2 } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = { owner: 'בעלים', admin: 'מנהל', member: 'חבר' };

export default function DealerTeamPage() {
  const { isAuthenticated, user } = useAuth();
  const [orgId, setOrgId] = useState('');
  const [myRole, setMyRole] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const orgsRes = await api.get<{ success: boolean; data: any[] }>('/api/organizations/my');
        const org = orgsRes.data[0];
        if (org) {
          setOrgId(org.id);
          setMyRole(org.myRole);
          const membersRes = await api.get<{ success: boolean; data: any[] }>(`/api/organizations/${org.id}/members`);
          setMembers(membersRes.data);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  async function invite() {
    if (!inviteEmail) return;
    setInviteError('');
    try {
      const res = await api.post<{ success: boolean; data: any }>(`/api/organizations/${orgId}/members`, { email: inviteEmail, role: inviteRole });
      setMembers((prev) => [...prev, res.data]);
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err?.message || 'שגיאה');
    }
  }

  async function removeMember(userId: string) {
    try {
      await api.delete(`/api/organizations/${orgId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch { /* ignore */ }
  }

  const canManage = ['owner', 'admin'].includes(myRole);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ניהול צוות</h1>

      {/* Invite */}
      {canManage && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">הזמנת חבר צוות</h2>
            {inviteError && <p className="text-sm text-red-600 mb-2">{inviteError}</p>}
            <div className="flex gap-2">
              <Input
                placeholder="כתובת אימייל"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="member">חבר</option>
                <option value="admin">מנהל</option>
              </select>
              <Button onClick={invite} className="gap-1"><UserPlus className="h-4 w-4" />הזמן</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : members.length > 0 ? (
        <div className="space-y-2">
          {members.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-500">{m.user?.name?.charAt(0) || '?'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.user?.name}</p>
                    <p className="text-xs text-gray-500">{m.user?.email}</p>
                  </div>
                  <Badge className="text-xs bg-gray-100 text-gray-700">{ROLE_LABELS[m.role] || m.role}</Badge>
                </div>
                {canManage && m.role !== 'owner' && m.userId !== user?.id && (
                  <button onClick={() => removeMember(m.userId)} className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium">אין חברי צוות</p>
        </div>
      )}
    </div>
  );
}
