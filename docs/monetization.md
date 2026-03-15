# Monetization

## Overview

ZUZZ monetizes through subscriptions (recurring) and promotions (one-time per listing).

## Subscription Plans

| Plan | Price (ILS/month) | Key Features |
|------|-------------------|--------------|
| Free | 0 | 3 active listings, basic trust score, unlimited messages |
| Basic | ₪99 | 20 listings, full trust score, basic stats, dealer logo |
| Pro | ₪249 | Unlimited listings, advanced stats, team management, promotion discounts |
| Enterprise | ₪499 | Everything in Pro + API access, custom integrations, dedicated account manager |

Plans are returned by `GET /api/checkout/plans` (public, no auth required).

## Promotion Types

| Type | Price (ILS/week) | Effect |
|------|------------------|--------|
| Boost | ₪29 | Increased visibility in search results |
| Highlight | ₪49 | Visual highlight on listing card |
| Featured | ₪99 | Featured section placement |
| Top of Search | ₪149 | Top position in search results |
| Gallery | ₪69 | Enhanced image gallery display |

Duration: 1–90 days, priced per week (rounded up).

## Checkout Flow

### 1. Create Session
`POST /api/checkout/create-session`

**Subscription:**
```json
{
  "type": "subscription",
  "plan": "pro",
  "durationMonths": 3,
  "organizationId": "org-123"
}
```

**Promotion:**
```json
{
  "type": "promotion",
  "promotionType": "featured",
  "listingId": "listing-123",
  "durationDays": 14
}
```

Returns `checkoutUrl` to redirect user to payment.

### 2. Payment Completion

**Sandbox mode:** `GET /api/checkout/sandbox-complete?paymentId=...` auto-completes payment.

**Production:** Payment provider sends webhook to `POST /api/checkout/webhook`.

### 3. Post-Payment Processing

On successful payment:
1. Payment status updated to `completed`
2. Invoice generated with VAT (17%)
3. For subscriptions: previous active subscription cancelled, new one created
4. For promotions: promotion created, listing marked as promoted

## Payment Status

`GET /api/checkout/payment/:id` — Returns payment details with invoices.
`GET /api/checkout/payments` — Paginated payment history.

## Invoice Generation

Invoices are auto-generated on payment completion:
- Sequential invoice numbers: `INV-000001`, `INV-000002`, ...
- Amount, tax (17% VAT), total
- Line items with descriptions

## Payment Providers

| Provider | Status | Env Vars |
|----------|--------|----------|
| Sandbox | Active (dev/test) | Default when no provider configured |
| Stripe | Placeholder | `STRIPE_SECRET_KEY`, `PAYMENT_PROVIDER=stripe` |

To add a new provider:
1. Add provider check in `create-session` endpoint
2. Implement checkout session creation
3. Handle webhook verification and callbacks

## Frontend Pages

- `/pricing` — Plan comparison and selection
- `/checkout/success` — Post-payment success screen
- Dashboard billing section for payment history
