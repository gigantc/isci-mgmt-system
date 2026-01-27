#!/bin/bash

################################################################################
# Deployment Script for ISCI Management System
#
# This script automates the deployment process:
# 1. Pulls latest code from Git
# 2. Installs dependencies
# 3. Builds the application
# 4. Restarts PM2 process
#
# Usage:
#   ./deploy.sh
#
# Prerequisites:
#   - Git repository configured
#   - Node.js and npm installed
#   - PM2 running with "isci-mgmt" app
#   - Run from /var/www/isci-mgmt-system directory
################################################################################

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Deployment directory
DEPLOY_DIR="/var/www/isci-mgmt-system"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ISCI Management System Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Are you in the project directory?${NC}"
    exit 1
fi

# Step 1: Git Pull
echo -e "${YELLOW}[1/6] Pulling latest code from Git...${NC}"
git pull origin main || {
    echo -e "${RED}Git pull failed. Please resolve conflicts manually.${NC}"
    exit 1
}
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 2: Install dependencies
# Note: We need ALL dependencies (including dev) because build requires react-router CLI
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
npm install || {
    echo -e "${RED}npm install failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Backup data (optional but recommended)
echo -e "${YELLOW}[3/6] Backing up data files...${NC}"
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/data_$DATE.tar.gz \
  data/*.json \
  public/uploads/profiles/* 2>/dev/null || true

echo -e "${GREEN}✓ Data backed up to: $BACKUP_DIR/data_$DATE.tar.gz${NC}"
echo ""

# Step 4: Build application
echo -e "${YELLOW}[4/7] Building application...${NC}"
npm run build || {
    echo -e "${RED}Build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# Step 5: Run database migrations
echo -e "${YELLOW}[5/7] Running database migrations...${NC}"
npx prisma generate || {
    echo -e "${RED}Prisma generate failed${NC}"
    exit 1
}
npx prisma migrate deploy || {
    echo -e "${RED}Database migration failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# Step 6: Create logs directory if it doesn't exist
echo -e "${YELLOW}[6/7] Setting up logs directory...${NC}"
mkdir -p logs
chmod 755 logs
echo -e "${GREEN}✓ Logs directory ready${NC}"
echo ""

# Step 7: Restart PM2
echo -e "${YELLOW}[7/7] Restarting application...${NC}"

# Check if PM2 process exists
if pm2 describe isci-mgmt > /dev/null 2>&1; then
    pm2 restart isci-mgmt || {
        echo -e "${RED}PM2 restart failed${NC}"
        exit 1
    }
else
    # First deployment - start with ecosystem file
    pm2 start ecosystem.config.cjs || {
        echo -e "${RED}PM2 start failed${NC}"
        exit 1
    }
    pm2 save
fi

echo -e "${GREEN}✓ Application restarted${NC}"
echo ""

# Display status
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
pm2 status
echo ""
echo -e "${GREEN}Recent logs:${NC}"
pm2 logs isci-mgmt --lines 10 --nostream

# Optional: Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +7 -delete 2>/dev/null || true

echo ""
echo -e "${GREEN}Deployment completed at: $(date)${NC}"
