#!/bin/bash
# Sync Supabase images to VPS
# File: scripts/vps/sync-images.sh
# Runs weekly on Sundays at 2 AM

DATE=$(date +%Y-%m-%d)
IMAGE_DIR="/opt/roll-nft-backup/image-cache"
LOG_FILE="/opt/roll-nft-backup/logs/image-sync-$DATE.log"

mkdir -p $IMAGE_DIR
mkdir -p /opt/roll-nft-backup/logs

echo "Starting image sync at $(date)" >> $LOG_FILE

# Download image manifest from Supabase
curl -o "$IMAGE_DIR/manifest.json" \
  "https://wemaymehbtnxkwxslhsu.supabase.co/storage/v1/object/list/nft-images" \
  2>> $LOG_FILE

if [ $? -eq 0 ]; then
  echo "Image manifest downloaded successfully" >> $LOG_FILE
  
  # Count images
  IMAGE_COUNT=$(grep -o "\"name\"" "$IMAGE_DIR/manifest.json" | wc -l)
  echo "Found $IMAGE_COUNT images" >> $LOG_FILE
else
  echo "Failed to download manifest" >> $LOG_FILE
fi

# Log completion
echo "Sync completed at $(date)" >> $LOG_FILE

# Clean old logs (keep 90 days)
find /opt/roll-nft-backup/logs -name "image-sync-*.log" -mtime +90 -delete

