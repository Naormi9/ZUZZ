# Analytics Events

## Client-Side Analytics

The analytics client (`apps/web/src/lib/analytics.ts`) provides typed event tracking with `navigator.sendBeacon` for reliable delivery.

### Implementation

Events are sent to `POST /api/analytics/event` with:
- `event` — event name
- `properties` — event-specific data
- `sessionId` — generated per browser session
- `url` — current page URL
- `referrer` — document referrer
- `userAgent` — browser user agent
- `timestamp` — ISO timestamp

### Event Catalog

#### Search & Discovery
| Event | Function | Properties |
|-------|----------|------------|
| `search` | `analytics.search()` | vertical, query, filters, resultCount |
| `search_save` | `analytics.searchSave()` | vertical, filters |
| `alert_enable` | `analytics.alertEnable()` | savedSearchId, frequency |

#### Listing Engagement
| Event | Function | Properties |
|-------|----------|------------|
| `listing_view` | `analytics.listingView()` | listingId, vertical, source |
| `listing_favorite` | `analytics.listingFavorite()` | listingId, action (add/remove) |
| `listing_share` | `analytics.listingShare()` | listingId, method |
| `listing_watch` | `analytics.listingWatch()` | listingId |
| `listing_compare` | `analytics.listingCompare()` | listingId, action (add/remove) |

#### Conversion
| Event | Function | Properties |
|-------|----------|------------|
| `lead_submit` | `analytics.leadSubmit()` | listingId, type |
| `message_send` | `analytics.messageSend()` | conversationId |
| `phone_reveal` | `analytics.phoneReveal()` | listingId |

#### Monetization
| Event | Function | Properties |
|-------|----------|------------|
| `plan_view` | `analytics.planView()` | — |
| `plan_select` | `analytics.planSelect()` | plan |
| `checkout_start` | `analytics.checkoutStart()` | type, plan/promotionType, amount |
| `checkout_success` | `analytics.checkoutSuccess()` | paymentId, amount |
| `checkout_failure` | `analytics.checkoutFailure()` | reason |
| `promotion_activate` | `analytics.promotionActivate()` | listingId, type |

#### Push & Notifications
| Event | Function | Properties |
|-------|----------|------------|
| `push_permission_accepted` | `analytics.pushPermissionAccepted()` | — |
| `push_permission_denied` | `analytics.pushPermissionDenied()` | — |
| `notification_opened` | `analytics.notificationOpened()` | notificationId, type |

#### Auth & Onboarding
| Event | Function | Properties |
|-------|----------|------------|
| `sign_up` | `analytics.signUp()` | method |
| `login` | `analytics.login()` | method |
| `dealer_onboarding_start` | `analytics.dealerOnboardingStart()` | — |
| `dealer_onboarding_complete` | `analytics.dealerOnboardingComplete()` | organizationId |

#### Listing Creation
| Event | Function | Properties |
|-------|----------|------------|
| `listing_create_start` | `analytics.listingCreateStart()` | vertical |
| `listing_create_complete` | `analytics.listingCreateComplete()` | listingId, vertical |

## Server-Side Analytics

Events are stored in the `AnalyticsEvent` model and queryable via:
- `GET /api/analytics/summary` (admin/moderator only) — aggregated metrics
