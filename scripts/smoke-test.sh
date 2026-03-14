#!/usr/bin/env bash
set -euo pipefail

# ZUZZ Post-Deploy Smoke Test
# Usage: ./scripts/smoke-test.sh [API_BASE_URL] [WEB_URL] [ADMIN_URL]
#
# Verifies core platform functionality after deployment.
# Exit code 0 = all checks passed, non-zero = failures detected.

API_URL="${1:-http://localhost:4000}"
WEB_URL="${2:-http://localhost:3000}"
ADMIN_URL="${3:-http://localhost:3001}"

PASSED=0
FAILED=0
WARNINGS=0

pass() { echo "  ✅ $1"; PASSED=$((PASSED + 1)); }
fail() { echo "  ❌ $1"; FAILED=$((FAILED + 1)); }
warn() { echo "  ⚠️  $1"; WARNINGS=$((WARNINGS + 1)); }

check_http() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    local actual_status
    actual_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
    if [ "$actual_status" = "$expected_status" ]; then
        pass "$description (HTTP $actual_status)"
    else
        fail "$description (expected $expected_status, got $actual_status)"
    fi
}

check_json() {
    local url="$1"
    local description="$2"
    local jq_filter="$3"
    local expected="$4"
    local result
    result=$(curl -s --max-time 10 "$url" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(eval('d$jq_filter'))" 2>/dev/null || echo "PARSE_ERROR")
    if [ "$result" = "$expected" ]; then
        pass "$description"
    else
        fail "$description (expected '$expected', got '$result')"
    fi
}

echo "========================================="
echo "  ZUZZ Smoke Test"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "  API:   $API_URL"
echo "  Web:   $WEB_URL"
echo "  Admin: $ADMIN_URL"
echo "========================================="

# --- 1. Health Checks ---
echo ""
echo "🏥 Health Checks"
check_http "$API_URL/api/health/live" "API liveness"
check_http "$API_URL/api/health/ready" "API readiness"
check_http "$API_URL/api/health" "API full health"

# Check individual services
DB_STATUS=$(curl -s --max-time 10 "$API_URL/api/health" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('services',{}).get('database','unknown'))" 2>/dev/null || echo "unknown")
REDIS_STATUS=$(curl -s --max-time 10 "$API_URL/api/health" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('services',{}).get('redis','unknown'))" 2>/dev/null || echo "unknown")
[ "$DB_STATUS" = "connected" ] && pass "Database connected" || fail "Database: $DB_STATUS"
[ "$REDIS_STATUS" = "connected" ] && pass "Redis connected" || fail "Redis: $REDIS_STATUS"

# --- 2. Web App ---
echo ""
echo "🌐 Web App"
check_http "$WEB_URL" "Web app loads"

# --- 3. Admin App ---
echo ""
echo "🔧 Admin App"
check_http "$ADMIN_URL" "Admin app loads"

# --- 4. Auth Endpoints ---
echo ""
echo "🔐 Auth"
check_http "$API_URL/api/auth/register" "Auth register rejects GET" "404"

# Try register with invalid data (should return 400, not 500)
REGISTER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -X POST -H "Content-Type: application/json" \
    -d '{"email":"invalid"}' \
    "$API_URL/api/auth/register" 2>/dev/null || echo "000")
if [ "$REGISTER_STATUS" = "400" ]; then
    pass "Auth validation returns 400 for invalid input"
elif [ "$REGISTER_STATUS" = "429" ]; then
    pass "Auth rate-limited (429) — rate limiting is working"
else
    fail "Auth register returned unexpected status: $REGISTER_STATUS"
fi

# --- 5. Cars API ---
echo ""
echo "🚗 Cars API"
check_http "$API_URL/api/cars/search" "Cars search endpoint"

SEARCH_RESULT=$(curl -s --max-time 10 "$API_URL/api/cars/search" 2>/dev/null)
if echo "$SEARCH_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'listings' in d or 'data' in d or 'results' in d" 2>/dev/null; then
    pass "Cars search returns structured data"
else
    warn "Cars search response format unclear"
fi

# --- 6. Listings API ---
echo ""
echo "📋 Listings"
check_http "$API_URL/api/listings" "Listings endpoint responds"

# --- 7. Upload endpoint (should require auth) ---
echo ""
echo "📤 Upload"
UPLOAD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -X POST "$API_URL/api/upload/listing/fake/media" 2>/dev/null || echo "000")
if [ "$UPLOAD_STATUS" = "401" ] || [ "$UPLOAD_STATUS" = "403" ]; then
    pass "Upload requires authentication ($UPLOAD_STATUS)"
else
    warn "Upload returned $UPLOAD_STATUS (expected 401/403)"
fi

# --- 8. Favorites (should require auth) ---
echo ""
echo "❤️ Favorites"
FAV_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    "$API_URL/api/favorites" 2>/dev/null || echo "000")
if [ "$FAV_STATUS" = "401" ] || [ "$FAV_STATUS" = "403" ]; then
    pass "Favorites requires authentication ($FAV_STATUS)"
else
    warn "Favorites returned $FAV_STATUS (expected 401/403)"
fi

# --- 9. Messages (should require auth) ---
echo ""
echo "💬 Messages"
MSG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    "$API_URL/api/messages/conversations" 2>/dev/null || echo "000")
if [ "$MSG_STATUS" = "401" ] || [ "$MSG_STATUS" = "403" ]; then
    pass "Messages requires authentication ($MSG_STATUS)"
else
    warn "Messages returned $MSG_STATUS (expected 401/403)"
fi

# --- Results ---
echo ""
echo "========================================="
echo "  Results: $PASSED passed, $FAILED failed, $WARNINGS warnings"
echo "========================================="

if [ "$FAILED" -gt 0 ]; then
    echo "❌ Smoke test FAILED"
    exit 1
else
    echo "✅ Smoke test PASSED"
    exit 0
fi
