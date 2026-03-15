#!/usr/bin/env bash
set -euo pipefail

# Pre-deployment migration script for ZUZZ
# Usage: ./scripts/pre-deploy-migrate.sh
#
# This script:
# 1. Checks migration status
# 2. Creates a database backup (if pg_dump is available)
# 3. Applies pending migrations
# 4. Verifies the result
#
# Environment:
#   DATABASE_URL - required

echo "=== ZUZZ Pre-Deploy Migration ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
fi

# 1. Check current status
echo ""
echo "📋 Migration status:"
pnpm --filter @zuzz/database db:migrate:status 2>&1 || true

# 2. Backup if pg_dump is available
if command -v pg_dump &> /dev/null; then
    BACKUP_DIR="${BACKUP_DIR:-/var/backups/zuzz}"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/pre_migrate_$(date +%Y%m%d_%H%M%S).dump"
    echo ""
    echo "💾 Creating pre-migration backup: $BACKUP_FILE"
    pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_FILE" 2>&1 || echo "⚠️  Backup failed (non-fatal, continuing)"
fi

# 3. Apply migrations
echo ""
echo "🚀 Applying pending migrations..."
pnpm --filter @zuzz/database db:migrate:deploy

# 4. Verify
echo ""
echo "✅ Migration complete. Final status:"
pnpm --filter @zuzz/database db:migrate:status

echo ""
echo "=== Migration finished ==="
