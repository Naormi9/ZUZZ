import type { MediaItem, GeoRegion, Money } from './common';

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'sold'
  | 'archived'
  | 'rejected'
  | 'expired';

export type ListingVertical = 'cars' | 'homes' | 'market';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested' | 'flagged';

export interface ListingBase {
  id: string;
  userId: string;
  organizationId?: string;
  vertical: ListingVertical;
  status: ListingStatus;
  moderationStatus: ModerationStatus;
  title: string;
  description?: string;
  price: Money;
  isNegotiable: boolean;
  location: GeoRegion;
  media: MediaItem[];
  viewCount: number;
  favoriteCount: number;
  completenessScore: number;
  trustScore?: number;
  isFeatured: boolean;
  isPromoted: boolean;
  promotionExpiresAt?: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingStatusChange {
  id: string;
  listingId: string;
  fromStatus: ListingStatus;
  toStatus: ListingStatus;
  reason?: string;
  changedBy: string;
  createdAt: Date;
}

export interface ListingDocument {
  id: string;
  listingId: string;
  type: DocumentType;
  url: string;
  name: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  uploadedAt: Date;
}

export type DocumentType =
  | 'vehicle_license'
  | 'vehicle_test'
  | 'insurance'
  | 'ownership_certificate'
  | 'inspection_report'
  | 'property_deed'
  | 'floor_plan'
  | 'other';

export interface ListingReport {
  id: string;
  listingId: string;
  reportedBy: string;
  reason: ReportReason;
  description?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: Date;
}

export type ReportReason =
  | 'fake_listing'
  | 'wrong_price'
  | 'wrong_info'
  | 'duplicate'
  | 'scam'
  | 'inappropriate'
  | 'sold_elsewhere'
  | 'other';

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: Date;
}
