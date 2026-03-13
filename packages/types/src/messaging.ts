export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: Date;
  lastMessagePreview?: string;
  buyerUnreadCount: number;
  sellerUnreadCount: number;
  status: 'active' | 'archived' | 'blocked';
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'system' | 'offer' | 'canned_reply';
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface Lead {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  type: 'contact' | 'test_drive' | 'inspection' | 'financing' | 'insurance' | 'offer';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  message?: string;
  phone?: string;
  email?: string;
  metadata?: Record<string, unknown>;
  respondedAt?: Date;
  createdAt: Date;
}

export interface CannedReply {
  id: string;
  userId: string;
  label: string;
  content: string;
  order: number;
}
