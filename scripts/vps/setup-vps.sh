#!/bin/bash
# VPS Setup Script
# File: scripts/vps/setup-vps.sh
# Run this once to set up VPS backup system

echo "Setting up Roll NFT VPS Backup System..."

# Create directory structure
echo "Creating directories..."
mkdir -p /opt/roll-nft-backup/{db-backups/daily,db-backups/weekly,db-backups/monthly,image-cache,logs,scripts}

# Copy scripts
echo "Copying backup scripts..."
cp backup-database.sh /opt/roll-nft-backup/scripts/
cp sync-images.sh /opt/roll-nft-backup/scripts/

# Make executable
chmod +x /opt/roll-nft-backup/scripts/*.sh

# Install cron jobs
echo "Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/roll-nft-backup/scripts/backup-database.sh >> /opt/roll-nft-backup/logs/backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/roll-nft-backup/scripts/sync-images.sh") | crontab -

echo "Cron jobs installed:"
crontab -l | grep roll-nft-backup

echo ""
echo "✅ VPS setup complete!"
echo ""
echo "Directory structure:"
ls -la /opt/roll-nft-backup/
echo ""
echo "Next steps:"
echo "1. Edit /opt/roll-nft-backup/scripts/backup-database.sh"
echo "2. Replace [PASSWORD] with your Supabase password"
echo "3. Test backup: /opt/roll-nft-backup/scripts/backup-database.sh"
echo ""
echo "Backup schedule:"
echo "- Database: Daily at 3:00 AM UTC"
echo "- Images: Weekly on Sundays at 2:00 AM UTC"

