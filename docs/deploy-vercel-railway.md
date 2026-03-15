# ZUZZ Deployment Guide — Vercel + Railway

מדריך מלא להעלאת ZUZZ לאוויר בלי VPS, בלי nginx, בלי SSL ידני.

## ארכיטקטורה

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   DNS + CDN     │
                    └───────┬─────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │   Vercel     │ │   Vercel    │ │   Railway   │
    │   Web App    │ │  Admin App  │ │   API       │
    │  (Next.js)   │ │  (Next.js)  │ │  (Express)  │
    │  :3000       │ │  :3001      │ │  :4000      │
    └──────────────┘ └─────────────┘ └──────┬──────┘
                                            │
                                    ┌───────┼───────┐
                                    │       │       │
                              ┌─────▼──┐ ┌──▼───┐ ┌▼─────────┐
                              │Postgres│ │Redis │ │Cloudflare │
                              │+PostGIS│ │      │ │R2 (S3)    │
                              │Railway │ │Railway│ │           │
                              └────────┘ └──────┘ └───────────┘
```

---

## שלב 1: Railway — API + Database + Redis

### 1.1 יצירת פרויקט

1. היכנס ל-[railway.app](https://railway.app) → **New Project**
2. שם: `zuzz-production`

### 1.2 PostgreSQL + PostGIS

1. בפרויקט → **+ New** → **Database** → **PostgreSQL**
2. Railway נותן PostGIS כברירת מחדל על PostgreSQL 16
3. אחרי יצירת ה-DB, לך ל-**Variables** tab ותעתיק את `DATABASE_URL`
4. **חשוב:** הוסף `?schema=public` בסוף ה-URL אם לא קיים

### 1.3 Redis

1. **+ New** → **Database** → **Redis**
2. העתק את `REDIS_URL` מה-Variables tab

### 1.4 API Service

1. **+ New** → **GitHub Repo** → בחר את ה-repo `ZUZZ`
2. Railway יזהה את ה-Dockerfile אוטומטית

**Settings (חשוב!):**

| Setting | Value |
|---------|-------|
| **Root Directory** | `/apps/api` |
| **Builder** | Dockerfile |
| **Dockerfile Path** | `apps/api/Dockerfile` |
| **Watch Paths** | `apps/api/**`, `packages/**` |
| **Port** | `4000` |
| **Health Check Path** | `/api/health/ready` |
| **Restart Policy** | On failure (max 3) |

> **הערה חשובה לגבי Dockerfile:** ה-Dockerfile משתמש ב-`turbo prune` מה-root של הריפו. ב-Railway צריך להגדיר את ה-Root Directory ל-`/` (root) ולהצביע על `apps/api/Dockerfile` ב-Dockerfile Path. אם יש בעיה עם build context, שנה Root Directory ל-`/` ותשאיר Dockerfile Path = `apps/api/Dockerfile`.

### 1.5 Environment Variables — API

הגדר את כל המשתנים האלה ב-Railway service → Variables:

```env
# Database — השתמש ב-Railway variable reference
DATABASE_URL=${{Postgres.DATABASE_URL}}?schema=public

# Redis — השתמש ב-Railway variable reference
REDIS_URL=${{Redis.REDIS_URL}}

# Auth
AUTH_SECRET=<generate: openssl rand -base64 32>
AUTH_URL=https://zuzz.co.il

# Storage (Cloudflare R2 — ראה שלב 3)
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=<from R2>
STORAGE_SECRET_KEY=<from R2>
STORAGE_BUCKET=zuzz-media
STORAGE_REGION=auto
STORAGE_PUBLIC_URL=https://media.zuzz.co.il

# Email (Resend)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=<resend API key>
SMTP_FROM=noreply@zuzz.co.il

# URLs
API_URL=https://api.zuzz.co.il
API_PORT=4000
NEXT_PUBLIC_API_URL=https://api.zuzz.co.il
NEXT_PUBLIC_APP_URL=https://zuzz.co.il
NEXT_PUBLIC_WS_URL=wss://api.zuzz.co.il
NEXT_PUBLIC_SITE_URL=https://www.zuzz.co.il
NEXT_PUBLIC_ADMIN_URL=https://admin.zuzz.co.il

# Maps (optional at launch)
MAPS_PROVIDER=google
MAPS_API_KEY=<from Google Cloud Console>

# Payments (optional at launch)
PAYMENT_PROVIDER=stripe
PAYMENT_API_KEY=<from Stripe Dashboard>

# Feature Flags
FEATURE_FLAGS_PROVIDER=local

# Observability
LOG_LEVEL=info
NODE_ENV=production
SENTRY_DSN=<optional>

# Security
RATE_LIMIT_ENABLED=true
```

### 1.6 Custom Domain for API

1. Railway → API service → **Settings** → **Networking** → **Custom Domain**
2. הוסף: `api.zuzz.co.il`
3. Railway ייתן לך CNAME record — הוסף אותו ב-Cloudflare DNS
4. SSL — Railway מנפיק אוטומטית

---

## שלב 2: Vercel — Web + Admin

### 2.1 Web App

1. [vercel.com](https://vercel.com) → **Add New Project** → Import Git Repository → `ZUZZ`
2. **Framework Preset:** Next.js (auto-detected)

**Build Settings:**

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/web` |
| **Build Command** | `cd ../.. && pnpm turbo build --filter=@zuzz/web` |
| **Output Directory** | `.next` |
| **Install Command** | `cd ../.. && pnpm install` |
| **Node.js Version** | 22.x |

**Environment Variables:**

```env
NEXT_PUBLIC_API_URL=https://api.zuzz.co.il
NEXT_PUBLIC_APP_URL=https://zuzz.co.il
NEXT_PUBLIC_WS_URL=wss://api.zuzz.co.il
NEXT_PUBLIC_SITE_URL=https://www.zuzz.co.il
NEXT_PUBLIC_ADMIN_URL=https://admin.zuzz.co.il
NEXT_PUBLIC_MAPS_API_KEY=<if using client-side maps>
```

**Domain:**

1. **Settings** → **Domains** → הוסף `zuzz.co.il` + `www.zuzz.co.il`
2. Vercel ייתן לך A record ו-CNAME — הוסף ב-Cloudflare

### 2.2 Admin App

1. **Add New Project** (פרויקט נפרד!) → Import **אותו repo** `ZUZZ`
2. **Framework Preset:** Next.js

**Build Settings:**

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/admin` |
| **Build Command** | `cd ../.. && pnpm turbo build --filter=@zuzz/admin` |
| **Output Directory** | `.next` |
| **Install Command** | `cd ../.. && pnpm install` |
| **Node.js Version** | 22.x |

**Environment Variables:**

```env
NEXT_PUBLIC_API_URL=https://api.zuzz.co.il
NEXT_PUBLIC_APP_URL=https://zuzz.co.il
NEXT_PUBLIC_ADMIN_URL=https://admin.zuzz.co.il
```

**Domain:**

1. **Settings** → **Domains** → הוסף `admin.zuzz.co.il`

---

## שלב 3: Cloudflare R2 — Storage

### 3.1 יצירת Bucket

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage** → **Create bucket**
2. שם: `zuzz-media`
3. Location: Automatic (או EU אם יש אפשרות — קרוב לישראל)

### 3.2 Public Access

1. Bucket → **Settings** → **Public access** → Enable
2. חבר custom domain: `media.zuzz.co.il`
3. Cloudflare יוסיף DNS record אוטומטית

### 3.3 API Token

1. **R2** → **Manage R2 API Tokens** → **Create API Token**
2. Permissions: **Object Read & Write**
3. Specify bucket: `zuzz-media`
4. העתק Access Key ID ו-Secret Access Key → שים ב-Railway env vars

### 3.4 CORS Policy

ב-Bucket Settings → CORS → הוסף:

```json
[
  {
    "AllowedOrigins": [
      "https://zuzz.co.il",
      "https://www.zuzz.co.il",
      "https://admin.zuzz.co.il"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## שלב 4: Resend — Email

1. [resend.com](https://resend.com) → Sign up → **API Keys** → Create
2. **Domains** → הוסף `zuzz.co.il` → הוסף את ה-DNS records שהם נותנים ב-Cloudflare
3. השתמש ב-API key כ-`SMTP_PASS` ב-Railway

---

## שלב 5: Cloudflare DNS

הגדר את כל ה-DNS records:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | `zuzz.co.il` | Vercel IP (76.76.21.21) | DNS only (off) |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only (off) |
| CNAME | `admin` | `cname.vercel-dns.com` | DNS only (off) |
| CNAME | `api` | `<railway-provided>.up.railway.app` | DNS only (off) |
| CNAME | `media` | auto-added by R2 | Proxied (on) |

> **חשוב:** Vercel ו-Railway מנהלים SSL בעצמם. הגדר **DNS only** (ענן אפור) לכל הדומיינים שלהם. רק `media` צריך proxy (ענן כתום) כי R2 עובד דרך Cloudflare CDN.

---

## שלב 6: Database Migration

### First Deploy (הפעם הראשונה)

Railway מריץ את ה-Dockerfile שעושה `pnpm db:generate`, אבל **לא מריץ migrations אוטומטית**.

להרצת migrations:

**אפשרות א — Railway CLI (מומלץ):**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migration against production DB
railway run pnpm db:migrate:deploy
```

**אפשרות ב — Deploy Command ב-Railway:**

1. API service → **Settings** → **Deploy** → **Start Command**
2. שנה ל: `npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js`

> זה יריץ migrations בכל deploy לפני שהשרת עולה. בטוח כי `migrate deploy` רץ רק pending migrations.

**אפשרות ג — Service נפרד (לפרויקטים גדולים):**

1. צור service חדש ב-Railway → **Empty Service**
2. הגדר: `npx prisma migrate deploy`
3. חבר את אותו `DATABASE_URL`
4. הרץ ידנית לפני כל deploy

### Seeding (אופציונלי, לסביבת staging)

```bash
railway run pnpm db:seed
```

---

## שלב 7: WebSocket Validation

ה-API משתמש ב-Socket.IO (port 4000). Railway תומך ב-WebSockets כברירת מחדל.

### CORS Configuration

ב-`apps/api/src/index.ts`, ה-Socket.IO server מוגדר עם CORS ל-`NEXT_PUBLIC_APP_URL` ו-`NEXT_PUBLIC_ADMIN_URL`. ודא שהם מוגדרים נכון ב-Railway env vars.

### בדיקה

```javascript
// Open browser console on zuzz.co.il
const socket = io('wss://api.zuzz.co.il', { transports: ['websocket'] });
socket.on('connect', () => console.log('WS connected:', socket.id));
socket.on('connect_error', (err) => console.error('WS error:', err));
```

---

## שלב 8: Post-Deploy Verification

### Health Checks

```bash
# Liveness
curl https://api.zuzz.co.il/api/health/live

# Readiness (checks DB + Redis)
curl https://api.zuzz.co.il/api/health/ready

# Full status
curl https://api.zuzz.co.il/api/health
```

### Smoke Tests

הרץ את הסקריפט הקיים:

```bash
./scripts/smoke-test.sh \
  https://api.zuzz.co.il \
  https://zuzz.co.il \
  https://admin.zuzz.co.il
```

זה בודק 25 דברים: health endpoints, auth, cars API, upload, favorites, messages.

### בדיקות ידניות

- [ ] **Web** — `https://zuzz.co.il` נטען, תפריט עובד, RTL תקין
- [ ] **Admin** — `https://admin.zuzz.co.il` נטען
- [ ] **Auth** — הרשמה, התחברות, ניתוק
- [ ] **Upload** — העלאת תמונה לרכב (בודק R2 + CORS)
- [ ] **WebSocket** — פתח שיחה ותראה הודעה בזמן אמת
- [ ] **Search** — חיפוש רכב מחזיר תוצאות
- [ ] **SSL** — כל הדומיינים מאובטחים (ירוק בדפדפן)

---

## עלויות חודשיות (הערכה)

| שירות | תוכנית | עלות |
|--------|--------|------|
| Vercel | Pro (2 projects) | $20 |
| Railway | Usage-based | $5-15 |
| Cloudflare R2 | Free tier (10GB) | $0 |
| Cloudflare DNS | Free | $0 |
| Resend | Free (3K emails/mo) | $0 |
| Domain (zuzz.co.il) | Yearly | ~$10/year |
| **סה"כ** | | **~$25-35/mo** |

---

## CI/CD Flow

### Automatic Deploys

- **Vercel** — כל push ל-`main` עושה deploy אוטומטית ל-production. PR = preview deploy.
- **Railway** — כל push ל-`main` עושה deploy אוטומטית. הגדר ב-Settings → **Deploy triggers**.

### הגדרת Branch

ב-Railway וב-Vercel, ודא ש-Production branch = `main`.

### Deploy Workflow

```
git push origin main
  ├── Vercel: builds web → deploys to zuzz.co.il
  ├── Vercel: builds admin → deploys to admin.zuzz.co.il
  └── Railway: builds API → runs migrations → deploys to api.zuzz.co.il
```

---

## Rollback

### Vercel
Deployments → בחר deploy קודם → **Promote to Production**

### Railway
Deployments → בחר deploy קודם → **Redeploy**

### Database Rollback

```bash
# Check migration status
railway run pnpm db:migrate:status

# If needed, rollback manually with SQL
# (Prisma doesn't support automatic rollback in production)
```

---

## Staging Environment

ליצירת staging:

1. **Railway:** צור פרויקט נפרד `zuzz-staging` עם אותו setup
2. **Vercel:** הגדר Preview branches ל-`develop` branch
3. **Domains:** `staging.zuzz.co.il`, `admin-staging.zuzz.co.il`, `api-staging.zuzz.co.il`

---

## Troubleshooting

| בעיה | פתרון |
|------|--------|
| Build נכשל ב-Vercel | בדוק שה-Install Command מתחיל ב-`cd ../..` |
| API לא מתחבר ל-DB | בדוק `DATABASE_URL` ב-Railway variables |
| WebSocket לא מתחבר | ודא `NEXT_PUBLIC_WS_URL=wss://api.zuzz.co.il` |
| Upload נכשל | בדוק CORS policy ב-R2 + storage env vars |
| SSL error | ודא DNS only (לא proxied) ב-Cloudflare ל-Vercel/Railway |
| CORS errors | ודא `NEXT_PUBLIC_APP_URL` מוגדר נכון ב-API service |
| Migrations לא רצו | הרץ `railway run pnpm db:migrate:deploy` ידנית |
