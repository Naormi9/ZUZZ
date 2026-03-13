'use client';

import { useEffect, useState } from 'react';
import { Button, Spinner, EmptyState, Badge } from '@zuzz/ui';
import { formatRelativeTime } from '@zuzz/shared-utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/hooks/use-auth';

interface ConversationItem {
  id: string;
  lastMessagePreview?: string;
  lastMessageAt: string;
  unreadCount: number;
  otherUser: { id: string; name: string };
  listing: { id: string; title: string; priceAmount: number; vertical: string };
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: ConversationItem[] }>('/api/messages/conversations')
      .then(res => {
        setConversations(res.data);
        if (res.data.length > 0) setSelectedConv(res.data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedConv) {
      api.get<{ data: any[] }>(`/api/messages/conversations/${selectedConv}`)
        .then(res => setMessages(res.data))
        .catch(() => {});
    }
  }, [selectedConv]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    try {
      await api.post('/api/messages/send', { conversationId: selectedConv, content: newMessage });
      setMessages(prev => [...prev, { id: Date.now().toString(), senderId: user?.id, content: newMessage, createdAt: new Date().toISOString() }]);
      setNewMessage('');
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  if (conversations.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">הודעות</h1>
        <EmptyState title="אין הודעות" description="כשתיצור קשר עם מוכר, השיחה תופיע כאן" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">הודעות</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Conversation list */}
        <div className="border rounded-xl overflow-y-auto">
          {conversations.map(conv => (
            <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
              className={`w-full text-start p-4 border-b last:border-0 hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-blue-50' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{conv.otherUser.name}</span>
                {conv.unreadCount > 0 && (
                  <Badge variant="default">{conv.unreadCount}</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{conv.listing.title}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessagePreview}</p>
              <p className="text-[10px] text-gray-300 mt-1">{formatRelativeTime(conv.lastMessageAt)}</p>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="md:col-span-2 border rounded-xl flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[70%] rounded-xl px-4 py-2 text-sm ${msg.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="כתוב הודעה..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim()}>שלח</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
