export type ModerationAction =
  | 'approve'
  | 'reject'
  | 'request_changes'
  | 'suspend_user'
  | 'archive_listing'
  | 'mark_fraud'
  | 'add_note';

export interface ModerationCase {
  id: string;
  listingId?: string;
  userId?: string;
  reportId?: string;
  type: 'listing_review' | 'user_report' | 'fraud_detection' | 'content_report';
  status: 'open' | 'in_review' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  notes: ModerationNote[];
  actions: ModerationActionRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ModerationNote {
  id: string;
  caseId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export interface ModerationActionRecord {
  id: string;
  caseId: string;
  action: ModerationAction;
  performedBy: string;
  reason?: string;
  createdAt: Date;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeListings: number;
  pendingModeration: number;
  newUsersToday: number;
  newListingsToday: number;
  messagesExchangedToday: number;
  revenueThisMonth: number;
  openReports: number;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  rules?: FeatureFlagRule[];
  updatedAt: Date;
}

export interface FeatureFlagRule {
  type: 'percentage' | 'user_ids' | 'roles';
  value: string;
}
