# AWS Production Deployment Guide

Complete guide for deploying the ISCI Management System to AWS EC2.

## Current Production Environment

- **Platform**: AWS EC2 (Ubuntu 24.04 LTS)
- **Live URL**: http://54.158.87.192
- **Node.js**: v20.20.0
- **Database**: PostgreSQL 16.11
- **ORM**: Prisma
- **Process Manager**: PM2 (with auto-restart on crashes and server reboot)
- **Web Server**: Nginx (reverse proxy on port 80)
- **Application Directory**: `/var/www/isci-mgmt-system`

## Deployment Files

The repository includes complete deployment configuration:

### 1. ecosystem.config.cjs
PM2 process manager configuration
- **Important**: Uses `.cjs` extension for CommonJS compatibility (package.json has `"type": "module"`)
- Runs `npm start` (react-router-serve) instead of directly running build file
- React Router v7 requires `react-router-serve` to properly start the SSR server
- Configured for fork mode (not cluster) with auto-restart
- Logs to `/var/www/isci-mgmt-system/logs/`

### 2. nginx.conf
Nginx reverse proxy configuration
- Proxies requests from port 80 to Node.js app on port 3000
- Serves static assets directly (build/client/assets/, uploads/)
- Includes gzip compression, security headers, and WebSocket support
- **Note**: Contains placeholder `yourdomain.com` - replace before SSL setup

### 3. deploy.sh
Automated deployment script
- Pulls latest code from GitHub
- Installs dependencies with `npm install`
- Backs up data files before deployment
- Builds application
- Runs database migrations (`npx prisma generate` and `npx prisma migrate deploy`)
- Restarts PM2 process
- Cleans up old backups (7+ days)

### 4. .env.example
Environment configuration template

### 5. backup-db.sh
Database backup script
- Creates compressed PostgreSQL backup with timestamp
- Stores backups in `~/backups/database/`
- Automatically cleans up backups older than 30 days
- Parses credentials from `.env` file

### 6. restore-db.sh
Database restore script
- Restores database from backup file
- Stops application during restore
- Requires confirmation before proceeding
- Automatically restarts application after restore

## Database Setup (PostgreSQL)

### Installation

The application uses PostgreSQL for production data storage. Follow these steps to set up the database:

```bash
# Update package lists
sudo apt update

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Verify installation
psql --version

# Check service status
sudo systemctl status postgresql
```

### Database and User Creation

```bash
# Switch to postgres user and open PostgreSQL
sudo -u postgres psql
```

In the PostgreSQL prompt:

```sql
-- Create database
CREATE DATABASE isci_mgmt;

-- Create user with secure password (change password!)
CREATE USER isci_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE isci_mgmt TO isci_user;

-- Connect to database
\c isci_mgmt

-- Grant schema privileges (required for PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO isci_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO isci_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO isci_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO isci_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO isci_user;

-- Exit
\q
```

### Security Configuration

Edit PostgreSQL authentication configuration:

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Add this line BEFORE the other "local" entries:

```
local   isci_mgmt       isci_user                               md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

Test connection:

```bash
psql -U isci_user -d isci_mgmt -h localhost -W
```

### Environment Configuration

Create `.env` file in application directory:

```bash
cd /var/www/isci-mgmt-system
nano .env
```

Add database connection string (replace password with your actual password):

```
DATABASE_URL="postgresql://isci_user:your_password@localhost:5432/isci_mgmt"
```

**Important**: If your password contains special characters (`@`, `#`, `$`, `%`), they must be URL-encoded:
- `%` → `%25`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`

Example: Password `my@pass#123` becomes `my%40pass%23123`

Secure the file:

```bash
chmod 600 .env
```

### Database Schema Migration

After setting up PostgreSQL and creating the `.env` file:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push
```

### Data Migration

If migrating from existing JSON files:

```bash
# Ensure JSON files exist in data/ directory
ls -la data/

# Run migration script
node scripts/migrateJsonToDb.js
```

### Database Verification

Verify tables and data were created:

```bash
# Connect to database
psql -U isci_user -d isci_mgmt -h localhost -W

# List tables
\dt

# Check record counts
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Brand";
SELECT COUNT(*) FROM "ISCICode";
SELECT COUNT(*) FROM "Agency";

# Exit
\q
```

Or use Prisma Studio (GUI):

```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Database Backups

Create database backups using the provided script:

```bash
# Create backup
./backup-db.sh
```

Backups are stored in `~/backups/database/` with format `isci_mgmt_YYYYMMDD_HHMMSS.sql.gz`

**Automated Backups** (optional - set up cron job):

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /var/www/isci-mgmt-system && ./backup-db.sh >> ~/backups/backup.log 2>&1
```

### Database Restore

Restore from a backup file:

```bash
# List available backups
ls -lh ~/backups/database/

# Restore specific backup
./restore-db.sh ~/backups/database/isci_mgmt_20260127_210000.sql.gz
```

**Warning**: Restore will replace ALL data in the database. The script will prompt for confirmation.

### Database Troubleshooting

**Connection refused:**
```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

**Authentication failed:**
```bash
# Check pg_hba.conf configuration
sudo cat /etc/postgresql/16/main/pg_hba.conf | grep isci_user

# Restart after changes
sudo systemctl restart postgresql

# Test connection
psql -U isci_user -d isci_mgmt -h localhost -W
```

**Application can't connect:**
```bash
# Verify .env file exists and is correct
cat .env

# Check PostgreSQL is listening on port 5432
sudo lsof -i :5432

# Check application logs
pm2 logs isci-mgmt --err
```

**Prisma errors:**
```bash
# Regenerate Prisma client
npx prisma generate

# Check schema is in sync with database
npx prisma db push

# View database in GUI
npx prisma studio
```

## PM2 Commands (On Server)

```bash
# View application status
pm2 status

# View logs (live)
pm2 logs isci-mgmt

# View last 50 log lines
pm2 logs isci-mgmt --lines 50

# Restart application
pm2 restart isci-mgmt

# Stop application
pm2 stop isci-mgmt

# Monitor resources
pm2 monit
```

## Deployment Workflow

### Initial Deployment
1. Set up EC2 instance (Ubuntu 24.04 LTS)
2. Install Node.js v20.20.0
3. Install PM2: `npm install -g pm2`
4. Install Nginx: `sudo apt install nginx`
5. Install PostgreSQL: `sudo apt install postgresql postgresql-contrib`
6. Set up PostgreSQL database (see "Database Setup" section)
7. Clone repository to `/var/www/isci-mgmt-system`
8. Configure environment variables (`.env` with DATABASE_URL)
9. Install dependencies: `npm install`
10. Set up database schema: `npx prisma generate && npx prisma db push`
11. Migrate data (if needed): `node scripts/migrateJsonToDb.js`
12. Build application: `npm run build`
13. Configure Nginx with provided `nginx.conf`
14. Start PM2: `pm2 start ecosystem.config.cjs`
15. Save PM2 configuration: `pm2 save && pm2 startup`

### Updating Application
1. Push changes to GitHub
2. SSH into server: `ssh -i key.pem ubuntu@54.158.87.192`
3. Run deployment script: `cd /var/www/isci-mgmt-system && ./deploy.sh`
4. Verify: `pm2 status` and `pm2 logs isci-mgmt`

## Important Deployment Notes

1. **React Router v7 Requirement**: The app uses `npm start` (react-router-serve) instead of running the build file directly with node. Running `node build/server/index.js` will start the server but it exits immediately without output. Always use PM2 with the ecosystem.config.cjs file.

2. **File Extension**: `ecosystem.config.cjs` uses CommonJS syntax because package.json has `"type": "module"`. Do not rename to `.js` or it will fail to load.

3. **Data Persistence**: All application data is stored in PostgreSQL database. Profile images are stored in `public/uploads/profiles/`. Regular database backups are recommended (use `backup-db.sh`).

4. **Logs**: PM2 logs are written to `/var/www/isci-mgmt-system/logs/` and are excluded from git via `.gitignore`.

5. **SSL/HTTPS**: Not yet configured. When ready, update nginx.conf with domain name and follow Let's Encrypt setup instructions.

6. **Security**: Security groups should allow SSH (port 22) from your IP only, and HTTP (port 80) from anywhere. HTTPS (port 443) will be needed when SSL is configured.

## Server Management Commands

```bash
# SSH into server
ssh -i /path/to/key.pem ubuntu@54.158.87.192

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx config
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check disk space
df -h

# Check memory
free -h

# View Nginx logs
sudo tail -f /var/log/nginx/isci-mgmt-access.log
sudo tail -f /var/log/nginx/isci-mgmt-error.log
```

## Troubleshooting Production Issues

### 502 Bad Gateway
**Issue**: App not running or not listening on port 3000

```bash
pm2 status                    # Check if online
pm2 logs isci-mgmt --err      # Check error logs
sudo lsof -i :3000            # Check if port is listening
curl http://localhost:3000    # Test local connection
pm2 restart isci-mgmt         # Restart if needed
```

### App Crashes on Start
**Issue**: Check PM2 error logs

```bash
pm2 logs isci-mgmt --err --lines 100
```

### Out of Memory
**Issue**: Restart app to free memory

```bash
free -h                       # Check memory usage
pm2 restart isci-mgmt         # Restart app
```

### Deployment Script Fails
**Issue**: Check git permissions and build process

```bash
git status                    # Check for uncommitted changes
npm install                   # Try manual install
npm run build                 # Try manual build
```

## SSL/HTTPS Setup (TODO)

When ready to configure SSL:
1. Register a domain name
2. Update nginx.conf with your domain (replace `yourdomain.com`)
3. Install Certbot: `sudo apt install certbot python3-certbot-nginx`
4. Obtain SSL certificate: `sudo certbot --nginx -d yourdomain.com`
5. Configure auto-renewal: `sudo certbot renew --dry-run`
6. Update security groups to allow HTTPS (port 443)

## Backup Strategy

The application includes automated backup scripts for PostgreSQL:

### Database Backups

**Manual Backup:**
```bash
cd /var/www/isci-mgmt-system
./backup-db.sh
```

**Automated Daily Backups:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /var/www/isci-mgmt-system && ./backup-db.sh >> ~/backups/backup.log 2>&1
```

**Backup Features:**
- Compressed SQL dumps (`gzip`)
- Timestamped filenames
- Automatic rotation (keeps last 30 days)
- Stored in `~/backups/database/`

**Restore Procedure:**
```bash
# List available backups
ls -lh ~/backups/database/

# Restore from specific backup
./restore-db.sh ~/backups/database/isci_mgmt_YYYYMMDD_HHMMSS.sql.gz
```

### Profile Images Backup

Profile images in `public/uploads/profiles/` should also be backed up:

```bash
# Create backup directory
mkdir -p ~/backups/uploads

# Backup profile images
tar -czf ~/backups/uploads/profiles_$(date +%Y%m%d_%H%M%S).tar.gz \
  public/uploads/profiles/

# Automated backup (add to crontab)
0 3 * * * cd /var/www/isci-mgmt-system && tar -czf ~/backups/uploads/profiles_$(date +\%Y\%m\%d_\%H\%M\%S).tar.gz public/uploads/profiles/
```

### Optional: S3 Backups

For additional redundancy, sync backups to AWS S3:

```bash
# Install AWS CLI
sudo apt install awscli

# Configure AWS credentials
aws configure

# Sync database backups to S3
aws s3 sync ~/backups/database/ s3://your-bucket/isci-mgmt/database/

# Sync profile images to S3
aws s3 sync ~/backups/uploads/ s3://your-bucket/isci-mgmt/uploads/
```

## Monitoring (TODO)

Recommended monitoring:
1. Set up CloudWatch alarms for CPU/memory usage
2. Configure PM2 monitoring service
3. Set up uptime monitoring (e.g., UptimeRobot)
4. Configure error alerting
