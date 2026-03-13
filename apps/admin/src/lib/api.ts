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
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'שגיאה לא צפויה' })) as { message?: string };
      throw new ApiError(response.status, error.message || 'שגיאה בבקשה לשרת');
    }

    const json = await response.json() as { success?: boolean; data?: T } & Record<string, unknown>;
    // Unwrap the { success, data } envelope
    return (json.data !== undefined ? json.data : json) as T;
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
    return this.get<DashboardMetrics>('/api/admin/metrics');
  }

  // Users
  getUsers(params?: { search?: string; page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return this.get<PaginatedResponse<any>>(`/api/admin/users?${query.toString()}`);
  }

  toggleUserStatus(userId: string) {
    return this.patch<any>(`/api/admin/users/${userId}/toggle-active`);
  }

  // Moderation
  getModerationQueue(params?: { status?: string; page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return this.get<PaginatedResponse<any>>(`/api/admin/moderation?${query.toString()}`);
  }

  moderateItem(listingId: string, action: 'approve' | 'reject' | 'request_changes' | 'flag', reason?: string) {
    return this.post(`/api/admin/moderation/${listingId}/action`, { action, reason });
  }

  // Reports
  getReports(params?: { status?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    return this.get<any[]>(`/api/admin/reports?${query.toString()}`);
  }

  resolveReport(reportId: string) {
    return this.patch(`/api/admin/reports/${reportId}`, { status: 'resolved' });
  }

  dismissReport(reportId: string) {
    return this.patch(`/api/admin/reports/${reportId}`, { status: 'dismissed' });
  }

  // Organizations
  getOrganizations() {
    return this.get<any[]>('/api/admin/organizations');
  }

  // Feature Flags
  getFeatureFlags() {
    return this.get<FeatureFlag[]>('/api/admin/feature-flags');
  }

  toggleFeatureFlag(flagId: string, currentEnabled: boolean) {
    return this.patch<FeatureFlag>(`/api/admin/feature-flags/${flagId}`, { isEnabled: !currentEnabled });
  }

  // Audit Logs
  getAuditLogs(params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return this.get<PaginatedResponse<any>>(`/api/admin/audit-logs?${query.toString()}`);
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
  messagesExchangedToday: number;
  revenueThisMonth: number;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

export const adminApi = new AdminApiClient(API_BASE_URL);
