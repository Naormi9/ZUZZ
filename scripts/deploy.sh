#!/usr/bin/env bash
set -euo pipefail

# ZUZZ Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]
#
# Prerequisites:
#   - Docker & Docker Compose installed
#   - .env.production file configured
#   - Database accessible
#
# This script:
# 1. Validates environment
# 2. Pulls/builds images
# 3. Runs migrations
# 4. Deploys services
# 5. Runs health checks
# 6. Optionally runs smoke tests

ENVIRONMENT="${1:-staging}"
COMPOSE_FILE="docker-compose.production.yml"
HEALTH_URL="http://localhost:4000/api/health"
READY_URL="http://localhost:4000/api/health/ready"
MAX_HEALTH_RETRIES=30
HEALTH_RETRY_INTERVAL=5

echo "========================================="
echo "  ZUZZ Deploy — ${ENVIRONMENT}"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "========================================="

# 1. Validate env file exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found. Copy from .env.example and configure."
    exit 1
fi

# 2. Set GIT_SHA for build tracking
export GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "📦 Git SHA: ${GIT_SHA}"

# 3. Pull or build images
echo ""
echo "🐳 Building/pulling images..."
docker compose -f "$COMPOSE_FILE" build

# 4. Run migrations (separate step so failure is visible)
echo ""
echo "🗄️  Running database migrations..."
docker compose -f "$COMPOSE_FILE" run --rm migrate

# 5. Deploy services
echo ""
echo "🚀 Starting services..."
docker compose -f "$COMPOSE_FILE" up -d api web admin nginx

# 6. Health check loop
echo ""
echo "🏥 Waiting for API health..."
for i in $(seq 1 $MAX_HEALTH_RETRIES); do
    if curl -sf "$READY_URL" > /dev/null 2>&1; then
        echo "✅ API is ready! (attempt $i)"
        break
    fi
    if [ "$i" -eq "$MAX_HEALTH_RETRIES" ]; then
        echo "❌ API did not become ready after ${MAX_HEALTH_RETRIES} attempts"
        echo "Check logs: docker compose -f $COMPOSE_FILE logs api"
        exit 1
    fi
    echo "   Waiting... (attempt $i/$MAX_HEALTH_RETRIES)"
    sleep $HEALTH_RETRY_INTERVAL
done

# 7. Show full health status
echo ""
echo "📊 Health status:"
curl -s "$HEALTH_URL" | python3 -m json.tool 2>/dev/null || curl -s "$HEALTH_URL"

# 8. Smoke test hint
echo ""
echo "========================================="
echo "  ✅ Deployment complete!"
echo "  Run smoke tests: ./scripts/smoke-test.sh"
echo "========================================="
