# Post-Deploy Smoke Tests

Automated and manual checks to verify a deployment is healthy.

## Automated: `./scripts/smoke-test.sh`

```bash
./scripts/smoke-test.sh [API_URL] [WEB_URL] [ADMIN_URL]
# Defaults: http://localhost:4000 http://localhost:3000 http://localhost:3001
```

The script checks:

| Check                   | Expected    | Notes                        |
| ----------------------- | ----------- | ---------------------------- |
| API liveness            | 200         | `/api/health/live`           |
| API readiness           | 200         | `/api/health/ready`          |
| API full health         | 200         | `/api/health`                |
| Database connected      | `connected` | From health response         |
| Redis connected         | `connected` | From health response         |
| Web app loads           | 200         | Root URL                     |
| Admin app loads         | 200         | Root URL                     |
| Auth validation         | 400         | Invalid register rejected    |
| Cars search             | 200         | `/api/cars/search`           |
| Listings endpoint       | 200         | `/api/listings`              |
| Upload requires auth    | 401         | Unauthenticated upload fails |
| Favorites requires auth | 401         | Unauthenticated access fails |
| Messages requires auth  | 401         | Unauthenticated access fails |

## Manual Smoke Test Checklist

After automated tests pass, verify these journeys manually:

### Core Flow

- [ ] Open homepage — loads correctly, navigation works
- [ ] Click "Cars" — cars landing page loads
- [ ] Click "Search" — search page loads, filters work
- [ ] Register new account — form submits, OTP email received
- [ ] Verify OTP — logged in, redirected to dashboard
- [ ] Create car listing — wizard loads, fields accept input
- [ ] Upload photos — files upload successfully, previews show
- [ ] Publish listing — listing goes active, appears in search
- [ ] View listing detail — page loads, images show, trust info visible
- [ ] Favorite a listing — heart toggles, appears in favorites dashboard
- [ ] Send a lead/inquiry — form submits, notification sent
- [ ] Open messages — conversations load
- [ ] Log out — session cleared, redirected

### Admin Flow

- [ ] Log in to admin panel
- [ ] View user list
- [ ] View moderation queue
- [ ] Approve/reject a listing (if available)

### Edge Cases

- [ ] Visit a non-existent page — 404 page renders
- [ ] Visit without auth — protected pages redirect to login
- [ ] Visit with expired token — redirected to login
- [ ] Upload oversized file — error shown (max 10MB)
- [ ] Submit empty form — validation errors shown
