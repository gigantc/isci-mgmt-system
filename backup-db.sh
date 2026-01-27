#!/bin/bash

################################################################################
# Database Backup Script for ISCI Management System
#
# This script creates PostgreSQL database backups with rotation.
#
# Usage:
#   ./backup-db.sh
#
# Prerequisites:
#   - PostgreSQL installed and running
#   - Database credentials in .env file
#   - Run from /var/www/isci-mgmt-system directory
################################################################################

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="$HOME/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/isci_mgmt_$DATE.sql.gz"
RETENTION_DAYS=30

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database Backup - ISCI Management System${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Load database credentials from .env
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"')

# Parse connection string
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# URL decode password (handle special characters)
DB_PASS=$(echo "$DB_PASS" | sed 's/%25/%/g; s/%40/@/g; s/%23/#/g; s/%24/$/g')

if [ -z "$DB_NAME" ]; then
    echo -e "${RED}Error: Could not parse DATABASE_URL from .env${NC}"
    exit 1
fi

echo -e "${YELLOW}Backing up database: $DB_NAME${NC}"
echo -e "${YELLOW}Backup location: $BACKUP_FILE${NC}"
echo ""

# Create backup using pg_dump
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-acl --clean --if-exists | gzip > "$BACKUP_FILE"
unset PGPASSWORD

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup completed successfully${NC}"
    echo -e "${GREEN}  Size: $BACKUP_SIZE${NC}"
    echo ""
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Clean up old backups (keep last N days)
echo -e "${YELLOW}Cleaning up old backups (keeping last $RETENTION_DAYS days)...${NC}"
find $BACKUP_DIR -name "isci_mgmt_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# List recent backups
echo -e "${GREEN}Recent backups:${NC}"
ls -lh $BACKUP_DIR/isci_mgmt_*.sql.gz 2>/dev/null | tail -5 || echo "  No backups found"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup completed at: $(date)${NC}"
echo -e "${GREEN}========================================${NC}"
