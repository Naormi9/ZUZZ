const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

class AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'שגיאה לא צפויה' }));
      throw new ApiError(response.status, error.message || 'שגיאה בבקשה לשרת');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Dashboard
  getDashboardMetrics() {
    return this.get<DashboardMetrics>('/admin/dashboard/metrics');
  }

  // Users
  getUsers(params?: { search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return this.get<PaginatedResponse<User>>(`/admin/users?${query.toString()}`);
  }

  toggleUserStatus(userId: string) {
    return this.patch<User>(`/admin/users/${userId}/toggle-status`);
  }

  // Moderation
  getModerationQueue(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return this.get<PaginatedResponse<ModerationItem>>(`/admin/moderation?${query.toString()}`);
  }

  moderateItem(itemId: string, action: 'approve' | 'reject' | 'request_changes', reason?: string) {
    return this.post(`/admin/moderation/${itemId}/${action}`, { reason });
  }

  // Reports
  getReports(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return this.get<PaginatedResponse<Report>>(`/admin/reports?${query.toString()}`);
  }

  resolveReport(reportId: string) {
    return this.patch(`/admin/reports/${reportId}/resolve`);
  }

  dismissReport(reportId: string) {
    return this.patch(`/admin/reports/${reportId}/dismiss`);
  }

  // Organizations
  getOrganizations(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return this.get<PaginatedResponse<Organization>>(`/admin/organizations?${query.toString()}`);
  }

  // Feature Flags
  getFeatureFlags() {
    return this.get<FeatureFlag[]>('/admin/feature-flags');
  }

  toggleFeatureFlag(flagId: string) {
    return this.patch<FeatureFlag>(`/admin/feature-flags/${flagId}/toggle`);
  }

  // Audit Logs
  getAuditLogs(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return this.get<PaginatedResponse<AuditLog>>(`/admin/audit-logs?${query.toString()}`);
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Types
export interface DashboardMetrics {
  totalUsers: number;
  activeListings: number;
  pendingModeration: number;
  openReports: number;
  newUsersToday: number;
  newListingsToday: number;
  messagesToday: number;
  revenueThisMonth: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  listingsCount: number;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
}

export interface ModerationItem {
  id: string;
  listingId: string;
  listingTitle: string;
  listingType: string;
  sellerName: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  submittedAt: string;
  imageUrl?: string;
}

export interface Report {
  id: string;
  listingTitle: string;
  reason: string;
  reporterName: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  membersCount: number;
  listingsCount: number;
  verified: boolean;
  createdAt: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminApi = new AdminApiClient(API_BASE_URL);
