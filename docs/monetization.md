# Monetization System

Revenue infrastructure for ZUZZ marketplace.

## Plans

| Plan | Price/month | Max Listings | Promotions | Features |
|------|------------|--------------|------------|----------|
| Free | ₪0 | 3 | 0 | Basic trust score, standard support |
| Dealer Basic | ₪99 | 20 | 2/month | Enhanced trust, lead management |
| Dealer Pro | ₪299 | Unlimited | Unlimited | Premium trust, analytics, priority support |

## Promotion Types

| Type | Price/week | Effect |
|------|-----------|--------|
| Boost | ₪29 | Higher ranking in search |
| Highlight | ₪49 | Visual highlight in listings |
| Featured | ₪99 | Featured badge + priority |
| Top of Search | ₪149 | Always at top of results |
| Gallery | ₪69 | Enhanced media display |

## Payment Flow

```
User selects plan/promotion
         │
         ▼
POST /api/payments/checkout/subscription
  or /api/payments/checkout/promotion
         │
         ▼
Payment Provider creates checkout session
  ├── Sandbox: auto-completes (dev/test)
  └── Stripe: redirects to Stripe Checkout
         │
         ▼
On success → activate subscription/promotion
         │
         ▼
Generate Invoice (with 17% VAT)
```

## API Endpoints

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

Invoices are automatically created on payment completion:
- Invoice number: `INV-{timestamp}-{random}`
- Includes 17% VAT calculation
- Stored in the `invoices` table with line items
- Admin can view all invoices via `/api/payments/admin/invoices`

## Testing

```bash
pnpm test -- payments.test
```
