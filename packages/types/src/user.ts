import type { VerificationStatus, GeoRegion } from './common';

export type UserRole =
  | 'guest'
  | 'user'
  | 'private_seller'
  | 'buyer'
  | 'dealer'
  | 'real_estate_agent'
  | 'developer'
  | 'admin'
  | 'moderator'
  | 'support_agent';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatarUrl?: string;
  roles: UserRole[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  location?: GeoRegion;
  website?: string;
  responseTime?: number; // avg minutes
  responseRate?: number; // 0-100%
  memberSince: Date;
  listingsCount: number;
  soldCount: number;
  verificationStatus: VerificationStatus;
  badges: UserBadge[];
}

export interface UserBadge {
  type: BadgeType;
  label: string;
  earnedAt: Date;
}

export type BadgeType =
  | 'verified_identity'
  | 'verified_phone'
  | 'verified_email'
  | 'verified_owner'
  | 'verified_dealer'
  | 'verified_agent'
  | 'verified_developer'
  | 'trusted_seller'
  | 'fast_responder'
  | 'top_seller'
  | 'docs_uploaded';

export interface Organization {
  id: string;
  name: string;
  type: 'dealer' | 'agency' | 'developer' | 'business';
  logoUrl?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: GeoRegion;
  licenseNumber?: string;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface DealerProfile extends Organization {
  inventoryCount: number;
  avgResponseTime?: number;
  avgResponseRate?: number;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  openingHours?: Record<string, { open: string; close: string }>;
}

export interface AuthSession {
  userId: string;
  email: string;
  roles: UserRole[];
  expiresAt: Date;
}

export interface LoginRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  phone?: string;
}
