# Monetization

## Overview

ZUZZ monetizes through subscriptions (recurring) and promotions (one-time per listing).

## Subscription Plans

| Plan | Price (ILS/month) | Key Features |
|------|-------------------|--------------|
| Free | 0 | 3 active listings, basic trust score, unlimited messages |
| Basic | ₪99 | 20 listings, full trust score, basic stats, dealer logo |
| Pro | ₪249/₪299 | Unlimited listings, advanced stats, team management, promotion discounts |
| Enterprise | ₪499 | Everything in Pro + API access, custom integrations, dedicated account manager |

Plans are returned by `GET /api/checkout/plans` and `GET /api/payments/plans` (public, no auth required).

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
`POST /api/checkout/create-session` or `POST /api/payments/checkout/subscription`

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

**Production:** Payment provider sends webhook to `POST /api/checkout/webhook` or `POST /api/payments/webhook`.

### 3. Post-Payment Processing

On successful payment:
1. Payment status updated to `completed`
2. Invoice generated with VAT (17%)
3. For subscriptions: previous active subscription cancelled, new one created
4. For promotions: promotion created, listing marked as promoted

## API Endpoints

### Checkout Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/checkout/plans` | Public | List available plans |
| POST | `/api/checkout/create-session` | User | Start checkout session |
| GET | `/api/checkout/sandbox-complete` | — | Sandbox payment completion |
| POST | `/api/checkout/webhook` | — | Payment webhook handler |
| GET | `/api/checkout/payment/:id` | User | Payment details with invoices |
| GET | `/api/checkout/payments` | User | Paginated payment history |

### Payment Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/payments/plans` | Public | List available plans |
| GET | `/api/payments/promotion-prices` | Public | List promotion prices |
| POST | `/api/payments/checkout/subscription` | User | Start subscription checkout |
| POST | `/api/payments/checkout/promotion` | User | Start promotion checkout |
| POST | `/api/payments/webhook` | — | Stripe webhook handler |
| GET | `/api/payments/my` | User | My payment history |
| GET | `/api/payments/invoices` | User | My invoices |
| GET | `/api/payments/admin/all` | Admin | All payments |
| GET | `/api/payments/admin/invoices` | Admin | All invoices |

## Stripe Integration

### Environment Variables

```bash
PAYMENT_PROVIDER="stripe"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_BASIC="price_..."
STRIPE_PRICE_PRO="price_..."
```

### Webhook Events Handled

- `checkout.session.completed` — Activate subscription or promotion
- `customer.subscription.deleted` — Cancel subscription
- `invoice.payment_failed` — Mark subscription as past_due

### Stripe Setup

1. Create products in Stripe Dashboard (Basic, Pro plans)
2. Create recurring prices for each product
3. Set price IDs in `STRIPE_PRICE_BASIC` and `STRIPE_PRICE_PRO`
4. Configure webhook endpoint: `https://api.zuzz.co.il/api/payments/webhook`
5. Set `STRIPE_WEBHOOK_SECRET` from Stripe Dashboard

## Sandbox Mode

When `PAYMENT_PROVIDER=sandbox` (default in dev):
- Checkout sessions auto-complete
- Subscriptions activate immediately
- Invoices are generated
- No real payment is processed

## Invoice Generation

Invoices are auto-generated on payment completion:
- Sequential invoice numbers: `INV-000001`, `INV-000002`, ...
- Amount, tax (17% VAT), total
- Line items with descriptions
- Admin can view all invoices via `/api/payments/admin/invoices`

## Payment Providers

| Provider | Status | Env Vars |
|----------|--------|----------|
| Sandbox | Active (dev/test) | Default when no provider configured |
| Stripe | Production | `STRIPE_SECRET_KEY`, `PAYMENT_PROVIDER=stripe` |

## Frontend Pages

- `/pricing` — Plan comparison and selection
- `/checkout/success` — Post-payment success screen
- Dashboard billing section for payment history

## Testing

```bash
pnpm test -- checkout.test
pnpm test -- payments.test
```
