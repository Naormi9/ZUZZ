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
npx prisma migrate status --schema packages/database/prisma/schema.prisma 2>&1 || true

# 2. Backup if pg_dump is available
if command -v pg_dump &> /dev/null; then
    BACKUP_DIR="${BACKUP_DIR:-/tmp/zuzz-backups}"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/pre_migrate_$(date +%Y%m%d_%H%M%S).dump"
    echo ""
    echo "💾 Creating pre-migration backup: $BACKUP_FILE"
    pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_FILE" 2>&1 || echo "⚠️  Backup failed (non-fatal, continuing)"
fi

# 3. Apply migrations
echo ""
echo "🚀 Applying pending migrations..."
npx prisma migrate deploy --schema packages/database/prisma/schema.prisma

# 4. Verify
echo ""
echo "✅ Migration complete. Final status:"
npx prisma migrate status --schema packages/database/prisma/schema.prisma

echo ""
echo "=== Migration finished ==="
