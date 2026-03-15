# ZUZZ Mobile App — Store Submission Checklist

## Apple App Store

### Prerequisites

- [ ] Apple Developer account ($99/year) — https://developer.apple.com
- [ ] App created in App Store Connect
- [ ] Bundle ID registered: `il.co.zuzz.app`
- [ ] Distribution certificate created
- [ ] Provisioning profile created

### App Store Listing

- [ ] App name: ZUZZ
- [ ] Subtitle: המקום שבו עסקאות זזות באמת
- [ ] Description (Hebrew + English)
- [ ] Keywords (Hebrew + English)
- [ ] Screenshots:
  - [ ] 6.7" display (iPhone 15 Pro Max): 1290 × 2796 px
  - [ ] 6.5" display (iPhone 14 Plus): 1284 × 2778 px
  - [ ] 5.5" display (iPhone 8 Plus): 1242 × 2208 px
  - [ ] iPad Pro 12.9": 2048 × 2732 px (if supporting iPad)
- [ ] App icon: 1024 × 1024 px (no transparency, no rounded corners)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)

### Privacy & Compliance

- [ ] App Privacy details filled:
  - Contact info (email, phone)
  - User content (photos, listings)
  - Identifiers (user ID)
  - Usage data (analytics)
- [ ] Data collection disclosure
- [ ] Age rating: 4+ (marketplace, no objectionable content)
- [ ] Export compliance (no encryption beyond HTTPS → select "No")

### Technical Requirements

- [ ] Xcode archive builds successfully
- [ ] App passes Xcode validation
- [ ] No private API usage
- [ ] Universal links configured:
  - [ ] `apple-app-site-association` file hosted at `https://zuzz.co.il/.well-known/apple-app-site-association`
  - [ ] Associated Domains entitlement enabled in Xcode
- [ ] Push notification entitlement (if using push)
- [ ] APNS key or certificate uploaded to push provider

### App Review Risks

- [ ] **Web wrapper concern**: Apple may reject apps that are "merely a web clip". Mitigations:
  - Native camera integration for listing photos
  - Native share sheet
  - Push notifications
  - Haptic feedback
  - Deep linking
  - Offline detection banner
  - Native-feeling navigation (back button, status bar)
- [ ] Test on physical device before submission
- [ ] Prepare app review notes explaining native features
- [ ] Provide demo account credentials for review team

---

## Google Play Store

### Prerequisites

- [ ] Google Play Developer account ($25 one-time) — https://play.google.com/console
- [ ] App created in Google Play Console
- [ ] Upload keystore created and securely stored
- [ ] App signing enrolled (Google manages signing key)

### Play Store Listing

- [ ] App name: ZUZZ
- [ ] Short description (80 chars, Hebrew)
- [ ] Full description (4000 chars, Hebrew + English)
- [ ] Screenshots:
  - [ ] Phone: minimum 2, recommended 8 (16:9 or 9:16)
  - [ ] Tablet 7": minimum 1 (if supporting tablets)
  - [ ] Tablet 10": minimum 1 (if supporting tablets)
- [ ] Feature graphic: 1024 × 500 px
- [ ] App icon: 512 × 512 px (provided by Capacitor build)

### Privacy & Compliance

- [ ] Privacy policy URL
- [ ] Data safety form:
  - Data collected: name, email, phone, photos, location (approximate)
  - Data shared: none
  - Security practices: data encrypted in transit
- [ ] Content rating questionnaire completed
- [ ] Target audience: 18+ (financial transactions)
- [ ] Ads declaration: No ads

### Technical Requirements

- [ ] Signed .aab (Android App Bundle) uploaded
- [ ] Target API level 34+ (required by Google Play in 2024+)
- [ ] 64-bit support (default in Capacitor)
- [ ] App Links verified:
  - [ ] `assetlinks.json` hosted at `https://zuzz.co.il/.well-known/assetlinks.json`
  - [ ] Contains SHA-256 fingerprint of signing certificate
- [ ] Firebase project set up (for FCM push notifications):
  - [ ] `google-services.json` placed in `apps/mobile/android/app/`
  - [ ] FCM server key available for backend
- [ ] Permissions justified in store listing

### Play Store Review Risks

- [ ] Google is generally more lenient about web-wrapped apps than Apple
- [ ] Ensure camera permission is justified (listing photos)
- [ ] Ensure notification permission is requested contextually (not on first launch)

---

## Pre-Submission Testing Checklist

### Both Platforms

- [ ] App launches without crash
- [ ] Login/register flow works
- [ ] OTP verification works
- [ ] Browse cars listings
- [ ] View car detail page
- [ ] Search with filters
- [ ] Create a listing (requires auth)
- [ ] Upload photos for listing (camera + gallery)
- [ ] Share a listing
- [ ] Deep link opens correct screen
- [ ] Back navigation works correctly
- [ ] Keyboard doesn't overlap inputs
- [ ] RTL layout is correct
- [ ] Offline banner appears when disconnected
- [ ] App resumes correctly after backgrounding
- [ ] Logout works and clears session

### iOS-Specific

- [ ] Safe areas respected (notch, home indicator)
- [ ] No bounce scroll at top/bottom
- [ ] Status bar text is readable
- [ ] Swipe-back gesture works

### Android-Specific

- [ ] Hardware back button works
- [ ] Status bar color matches app
- [ ] No cleartext errors in production build
- [ ] Camera permission dialog appears when needed

---

## What Still Requires Manual Work

1. **Apple Developer account** — Must be purchased by ZUZZ team
2. **Google Play Developer account** — Must be purchased by ZUZZ team
3. **App Store screenshots** — Must be captured on real devices/simulators
4. **Privacy policy page** — Must be hosted at a public URL
5. **Push notification provider** — Firebase project setup + APNS configuration
6. **Universal links files** — Must be deployed to `zuzz.co.il/.well-known/`
7. **Signing certificates** — Must be created by the team with their accounts
8. **App review notes** — Should be written by the team explaining the app's native value
9. **Translations** — Store listing descriptions in Hebrew and English
