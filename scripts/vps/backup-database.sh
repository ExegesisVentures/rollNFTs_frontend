#!/bin/bash
# VPS Database Backup Script
# File: scripts/vps/backup-database.sh
# Runs daily at 3 AM UTC

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/opt/roll-nft-backup/db-backups/daily"
BACKUP_FILE="$BACKUP_DIR/supabase-$DATE.sql.gz"

# Supabase connection string
# TODO: Replace [PASSWORD] with actual Supabase password
SUPABASE_DB_URL="postgresql://postgres.wemaymehbtnxkwxslhsu:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Dump database
echo "Starting backup at $(date)..."
pg_dump "$SUPABASE_DB_URL" | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "File size: $FILE_SIZE"

  # Log to Supabase (optional)
  curl -X POST http://147.79.78.251:5058/api/vps-backup \
    -H "Content-Type: application/json" \
    -d "{
      \"backup_type\": \"database\",
      \"file_path\": \"$BACKUP_FILE\",
      \"file_size\": \"$FILE_SIZE\",
      \"status\": \"success\"
    }" 2>/dev/null

  echo "Backup logged to database"
else
  echo "Backup failed!"
  
  # Log failure
  curl -X POST http://147.79.78.251:5058/api/vps-backup \
    -H "Content-Type: application/json" \
    -d "{
      \"backup_type\": \"database\",
      \"status\": \"failed\",
      \"error_message\": \"pg_dump failed\"
    }" 2>/dev/null
  
  exit 1
fi

# Clean old backups (keep 30 days)
echo "Cleaning old backups..."
find $BACKUP_DIR -name "supabase-*.sql.gz" -mtime +30 -delete

echo "Cleanup complete. Backup finished at $(date)"

