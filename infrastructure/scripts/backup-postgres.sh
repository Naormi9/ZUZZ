#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL Backup Script for ZUZZ
# Usage: ./backup-postgres.sh [backup_dir]
#
# Environment variables:
#   DATABASE_URL  - PostgreSQL connection string (required)
#   S3_BUCKET     - S3 bucket for remote backup (optional)

BACKUP_DIR="${1:-/tmp/zuzz-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="zuzz_backup_${TIMESTAMP}.dump"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting PostgreSQL backup..."

# Extract connection details from DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL is not set"
    exit 1
fi

# Create backup using pg_dump custom format
pg_dump "$DATABASE_URL" \
    --format=custom \
    --verbose \
    --file="${BACKUP_DIR}/${BACKUP_FILE}" \
    2>&1

# Compress
gzip "${BACKUP_DIR}/${BACKUP_FILE}"
FINAL_FILE="${BACKUP_DIR}/${BACKUP_FILE}.gz"

echo "[$(date)] Backup created: ${FINAL_FILE}"
echo "[$(date)] Size: $(du -h "${FINAL_FILE}" | cut -f1)"

# Upload to S3 if configured
if [ -n "${S3_BUCKET:-}" ]; then
    echo "[$(date)] Uploading to S3..."
    aws s3 cp "${FINAL_FILE}" "s3://${S3_BUCKET}/backups/${BACKUP_FILE}.gz"
    echo "[$(date)] Uploaded to s3://${S3_BUCKET}/backups/${BACKUP_FILE}.gz"
fi

# Clean up old backups
echo "[$(date)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "zuzz_backup_*.dump.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Backup complete."
