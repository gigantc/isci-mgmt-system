# AWS Production Deployment Guide

Complete guide for deploying the ISCI Management System to AWS EC2.

## Current Production Environment

- **Platform**: AWS EC2 (Ubuntu 24.04 LTS)
- **Live URL**: http://54.158.87.192
- **Node.js**: v20.20.0
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
- Installs dependencies with `npm install --omit=dev`
- Backs up data files before deployment
- Builds application
- Restarts PM2 process
- Cleans up old backups (7+ days)

### 4. .env.example
Environment configuration template

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
5. Clone repository to `/var/www/isci-mgmt-system`
6. Configure environment variables (`.env`)
7. Run initial deployment: `./deploy.sh`
8. Configure Nginx with provided `nginx.conf`
9. Start PM2: `pm2 start ecosystem.config.cjs`
10. Save PM2 configuration: `pm2 save && pm2 startup`

### Updating Application
1. Push changes to GitHub
2. SSH into server: `ssh -i key.pem ubuntu@54.158.87.192`
3. Run deployment script: `cd /var/www/isci-mgmt-system && ./deploy.sh`
4. Verify: `pm2 status` and `pm2 logs isci-mgmt`

## Important Deployment Notes

1. **React Router v7 Requirement**: The app uses `npm start` (react-router-serve) instead of running the build file directly with node. Running `node build/server/index.js` will start the server but it exits immediately without output. Always use PM2 with the ecosystem.config.cjs file.

2. **File Extension**: `ecosystem.config.cjs` uses CommonJS syntax because package.json has `"type": "module"`. Do not rename to `.js` or it will fail to load.

3. **Data Persistence**: JSON files in `data/` directory are persisted on the server. Profile images are stored in `public/uploads/profiles/`.

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

## Backup Strategy (TODO)

Recommended backup approach:
1. Set up automated S3 backups for `data/` directory
2. Schedule daily backups using cron
3. Implement backup rotation (keep last 30 days)
4. Document restore procedure

## Monitoring (TODO)

Recommended monitoring:
1. Set up CloudWatch alarms for CPU/memory usage
2. Configure PM2 monitoring service
3. Set up uptime monitoring (e.g., UptimeRobot)
4. Configure error alerting
