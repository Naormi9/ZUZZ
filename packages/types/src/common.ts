export type Locale = 'he' | 'en';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoRegion {
  city?: string;
  region?: string;
  neighborhood?: string;
  point?: GeoPoint;
}

export type Currency = 'ILS' | 'USD' | 'EUR';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video' | 'document';
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  order: number;
  alt?: string;
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';
