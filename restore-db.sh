#!/bin/bash

################################################################################
# Database Restore Script for ISCI Management System
#
# This script restores PostgreSQL database from a backup file.
#
# Usage:
#   ./restore-db.sh <backup-file>
#   Example: ./restore-db.sh ~/backups/database/isci_mgmt_20260127_210000.sql.gz
#
# Prerequisites:
#   - PostgreSQL installed and running
#   - Database credentials in .env file
#   - Valid backup file
################################################################################

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database Restore - ISCI Management System${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo ""
    echo "Usage: ./restore-db.sh <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh $HOME/backups/database/isci_mgmt_*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Load database credentials from .env
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Extract database connection details from DATABASE_URL
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"')

# Parse connection string
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# URL decode password
DB_PASS=$(echo "$DB_PASS" | sed 's/%25/%/g; s/%40/@/g; s/%23/#/g; s/%24/$/g')

if [ -z "$DB_NAME" ]; then
    echo -e "${RED}Error: Could not parse DATABASE_URL from .env${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will replace all data in database: $DB_NAME${NC}"
echo -e "${YELLOW}Restore file: $BACKUP_FILE${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Restore cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Stopping application...${NC}"
pm2 stop isci-mgmt 2>/dev/null || true

echo -e "${YELLOW}Restoring database...${NC}"

# Restore backup
export PGPASSWORD="$DB_PASS"
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
unset PGPASSWORD

echo -e "${GREEN}✓ Database restored successfully${NC}"
echo ""

echo -e "${YELLOW}Starting application...${NC}"
pm2 start isci-mgmt 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Restore completed at: $(date)${NC}"
echo -e "${GREEN}========================================${NC}"
