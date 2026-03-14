'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Skeleton, Input } from '@zuzz/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/use-auth';
import { MessageCircle, Send, ArrowRight } from 'lucide-react';

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>('/api/messages/conversations');
        setConversations(res.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  async function loadMessages(convId: string) {
    setSelectedConv(convId);
    try {
      const res = await api.get<{ success: boolean; data: any[] }>(
        `/api/messages/conversations/${convId}`,
      );
      setMessages(res.data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      // ignore
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConv) return;
    setSending(true);
    try {
      await api.post('/api/messages/send', { conversationId: selectedConv, content: newMessage });
      setNewMessage('');
      await loadMessages(selectedConv);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">יש להתחבר</h1>
          <Link href="/auth/login">
            <Button>התחברות</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">הודעות</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '60vh' }}>
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : conversations.length > 0 ? (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadMessages(conv.id)}
                    className={`w-full text-right p-4 hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-brand-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900">
                        {conv.otherUser?.name}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{conv.listing?.title}</p>
                    {conv.lastMessagePreview && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {conv.lastMessagePreview}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">אין שיחות עדיין</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 flex flex-col" style={{ height: '60vh' }}>
            {selectedConv ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.id ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                          msg.senderId === user?.id
                            ? 'bg-brand-500 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${msg.senderId === user?.id ? 'text-brand-200' : 'text-gray-400'}`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('he-IL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t p-3 flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="הקלד הודעה..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  />
                  <Button onClick={sendMessage} loading={sending} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3" />
                  <p>בחר שיחה מהרשימה</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
