#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL Restore Script for ZUZZ
# Usage: ./restore-postgres.sh <backup_file>
#
# Environment variables:
#   DATABASE_URL  - PostgreSQL connection string (required)

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.dump.gz>"
    echo ""
    echo "Available backups:"
    ls -la /tmp/zuzz-backups/zuzz_backup_*.dump.gz 2>/dev/null || echo "  No local backups found"
    exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL is not set"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "[$(date)] Starting restore from: $BACKUP_FILE"
echo "WARNING: This will overwrite the current database. Press Ctrl+C to cancel."
echo "Waiting 5 seconds..."
sleep 5

# Decompress if needed
RESTORE_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    RESTORE_FILE="${BACKUP_FILE%.gz}"
    echo "[$(date)] Decompressing..."
    gunzip -k "$BACKUP_FILE"
fi

# Restore
echo "[$(date)] Restoring database..."
pg_restore "$RESTORE_FILE" \
    --dbname="$DATABASE_URL" \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    2>&1

# Clean up decompressed file
if [[ "$BACKUP_FILE" == *.gz ]] && [ -f "$RESTORE_FILE" ]; then
    rm "$RESTORE_FILE"
fi

echo "[$(date)] Restore complete."
