# Dealer Portal — Architecture & API Reference

## Overview

The dealer portal enables B2B supply-side operations: dealer onboarding, inventory management, lead CRM, promotions, team management, and billing. It spans three surfaces:

1. **Public web** (`apps/web`) — onboarding flow, dealer dashboard, public dealer profile
2. **API** (`apps/api`) — organization, promotion, and subscription routes
3. **Admin** (`apps/admin`) — organization approval/rejection, subscription management

## Data Model

### Organization
Central entity for dealers, agencies, and businesses.

| Field | Description |
|-------|-------------|
| `type` | `dealer`, `agency`, `developer`, `business` |
| `verificationStatus` | `pending` → `verified` / `rejected` / `suspended` |
| `isActive` | Soft-active flag |
| `dealerProfile` | 1:1 optional relation — specialties, opening hours, ratings |

### OrganizationMember
Join table between User and Organization.

| Role | Capabilities |
|------|-------------|
| `owner` | Full control, cannot be removed by others |
| `admin` | Manage members, edit org, manage inventory |
| `member` | View inventory, view leads |

### Promotion
Attached to a listing, created by listing owner or org member.

| Type | Price (per week) |
|------|-----------------|
| `boost` | ₪29 |
| `highlight` | ₪49 |
| `featured` | ₪99 |
| `top_of_search` | ₪149 |
| `gallery` | ₪69 |

### Subscription
Admin-assigned plans (no self-service payment yet).

Plans: `free`, `basic` (₪99/mo), `pro` (₪249/mo), `enterprise` (custom).

## API Routes

### Organizations (`/api/organizations`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | User | Create organization (dealer onboarding) |
| GET | `/my` | User | List user's organizations with role |
| GET | `/:id` | Public | Get organization by ID |
| PATCH | `/:id` | Owner/Admin | Update organization details |
| PATCH | `/:id/dealer-profile` | Owner/Admin | Update dealer profile |
| GET | `/:id/members` | Member+ | List organization members |
| POST | `/:id/members` | Owner/Admin | Invite member by email |
| DELETE | `/:id/members/:userId` | Owner/Admin | Remove member |
| GET | `/:id/listings` | Member+ | Paginated inventory with status filter |
| GET | `/:id/leads` | Member+ | Paginated leads across org listings |
| GET | `/:id/analytics` | Member+ | Organization performance metrics |
| GET | `/:id/public-listings` | Public | Active listings for dealer profile page |

### Promotions (`/api/promotions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | User | Create promotion (ownership check) |
| GET | `/my` | User | List user's promotions |
| PATCH | `/:id/cancel` | Owner/Admin | Cancel active promotion |
| GET | `/admin/all` | Admin/Mod | List all promotions |

### Subscriptions (`/api/subscriptions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/my` | User | Get active subscription |
| GET | `/admin/all` | Admin | List all subscriptions |
| POST | `/admin/assign` | Admin | Assign plan to user |
| PATCH | `/admin/:id/cancel` | Admin | Cancel subscription |

### Admin Extensions (`/api/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/organizations` | Admin | List orgs with status filter |
| GET | `/organizations/:id` | Admin | Full org detail |
| POST | `/organizations/:id/action` | Admin | approve/reject/suspend/reactivate |

## Web Pages

### Dealer Onboarding
**Path:** `/dealer/onboarding`
Two-step form: business details → location & extras → POST to create organization.

### Dealer Dashboard
**Path:** `/dashboard/dealer`
Stats overview with quick navigation to sub-pages:

- `/dashboard/dealer/inventory` — Listings management with status filters
- `/dashboard/dealer/leads` — CRM-lite: lead cards with status updates
- `/dashboard/dealer/promotions` — Active/inactive promotions, cancel
- `/dashboard/dealer/team` — Invite members, manage roles
- `/dashboard/dealer/billing` — Subscription status, plan tiers
- `/dashboard/dealer/settings` — Organization details form

### Public Dealer Profile
**Path:** `/dealers/[id]`
SEO-optimized page with `generateMetadata()` layout, breadcrumbs, contact info, and active listings grid.

## Permission Model

All organization-scoped mutations go through `requireOrgMember(userId, orgId, roles?)`:
- Verifies the user is a member of the organization
- Optionally restricts by role (e.g., only `owner` or `admin`)
- Throws 403 if unauthorized

Cross-org access is prevented: a user can only access resources within organizations they belong to.

## Verification Flow

1. User creates organization → status = `pending`
2. Admin reviews in admin panel → approves or rejects
3. On approval: status = `verified`, notification sent to owner
4. Admin can later suspend or reactivate
5. All admin actions create AuditLog entries

## Tests

Test files: `organizations.test.ts`, `promotions.test.ts`, `subscriptions.test.ts`

Coverage areas:
- Organization CRUD and permission checks
- Member invite/remove with role restrictions
- Promotion creation with ownership validation (user, org member, admin)
- Promotion cancellation with authorization
- Subscription admin operations
- Cross-role access denial (member can't edit, non-member gets 403)
