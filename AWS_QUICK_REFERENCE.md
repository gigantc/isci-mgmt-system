# AWS EC2 Quick Reference Guide

Quick reference for common operations when managing the ISCI Management System on AWS EC2.

## SSH Connection

```bash
# Connect to EC2 instance
ssh -i /path/to/your-key.pem ubuntu@your-instance-ip

# Or if you have Elastic IP/domain
ssh -i /path/to/your-key.pem ubuntu@yourdomain.com
```

---

## Application Management

### Deploy Updates

```bash
# Simple deployment (recommended)
cd /var/www/isci-mgmt-system
./deploy.sh
```

### Manual Deployment Steps

```bash
cd /var/www/isci-mgmt-system

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart app
pm2 restart isci-mgmt
```

---

## PM2 Process Management

### Status & Monitoring

```bash
pm2 status              # Show all processes
pm2 describe isci-mgmt  # Detailed info about app
pm2 monit              # Real-time monitoring dashboard
pm2 logs isci-mgmt     # Stream logs (live)
pm2 logs --lines 100   # Show last 100 log lines
pm2 flush              # Clear all log files
```

### Control Commands

```bash
pm2 start ecosystem.config.js   # Start app (first time)
pm2 restart isci-mgmt          # Restart app
pm2 reload isci-mgmt           # Zero-downtime reload
pm2 stop isci-mgmt             # Stop app
pm2 delete isci-mgmt           # Remove from PM2
```

### Save PM2 Configuration

```bash
pm2 save    # Save current process list (persists across reboots)
```

---

## Nginx Management

### Configuration

```bash
# Test configuration
sudo nginx -t

# Reload configuration (no downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/isci-mgmt-access.log

# Error logs
sudo tail -f /var/log/nginx/isci-mgmt-error.log

# All Nginx logs
sudo tail -f /var/log/nginx/*.log
```

---

## SSL Certificates (Let's Encrypt)

### Check Certificate Status

```bash
sudo certbot certificates
```

### Renew Certificates

```bash
# Dry run (test renewal)
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Renew specific domain
sudo certbot renew --cert-name yourdomain.com
```

Note: Certificates auto-renew via cron job. Manual renewal rarely needed.

---

## System Monitoring

### Check Disk Space

```bash
df -h                    # Human-readable
du -sh /var/www/*        # Directory sizes
```

### Check Memory Usage

```bash
free -h                  # Human-readable
pm2 monit               # PM2 memory monitoring
htop                    # Interactive process viewer (if installed)
```

### Check CPU & Processes

```bash
top                     # Process list
ps aux | grep node      # Find Node.js processes
```

### Check Network Connections

```bash
sudo netstat -tulpn     # Active connections
sudo lsof -i :3000      # Check what's using port 3000
sudo lsof -i :80        # Check what's using port 80
sudo lsof -i :443       # Check what's using port 443
```

---

## Data Management

### Backup Data

```bash
# Manual backup
cd /var/www/isci-mgmt-system
tar -czf ~/backup_$(date +%Y%m%d).tar.gz data/*.json public/uploads/profiles/*

# Run backup script (if configured)
~/backup.sh
```

### Restore Data

```bash
# Extract backup
tar -xzf ~/backup_YYYYMMDD.tar.gz -C /var/www/isci-mgmt-system

# Set permissions
cd /var/www/isci-mgmt-system
chmod 644 data/*.json
chmod 755 public/uploads/profiles
```

### View Data Files

```bash
cd /var/www/isci-mgmt-system
cat data/isci-codes.json | jq '.'    # Pretty print JSON (requires jq)
ls -lh data/                          # List data files
ls -lh public/uploads/profiles/       # List profile images
```

---

## Git Operations

### Check Status

```bash
cd /var/www/isci-mgmt-system
git status
git log --oneline -10    # Last 10 commits
git branch              # Current branch
```

### Pull Updates

```bash
git pull origin main
```

### Reset to Specific Commit (CAREFUL!)

```bash
git reset --hard COMMIT_HASH    # Discards all local changes
git pull origin main
```

---

## Firewall (UFW)

### Check Status

```bash
sudo ufw status
sudo ufw status numbered
```

### Manage Rules

```bash
# Allow port
sudo ufw allow 80/tcp

# Remove rule
sudo ufw delete [rule-number]

# Enable/disable firewall
sudo ufw enable
sudo ufw disable
```

---

## Service Management

### Check Service Status

```bash
sudo systemctl status nginx
sudo systemctl status pm2-ubuntu    # PM2 startup service
```

### Restart Services

```bash
sudo systemctl restart nginx
sudo systemctl restart pm2-ubuntu
```

---

## Troubleshooting

### App Won't Start

```bash
# Check PM2 logs
pm2 logs isci-mgmt --err --lines 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Kill process on port 3000 (if needed)
sudo kill -9 $(sudo lsof -t -i:3000)

# Restart app
pm2 restart isci-mgmt
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -50 /var/log/nginx/isci-mgmt-error.log

# Check if port 3000 is accessible
curl http://localhost:3000
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Find large files
sudo du -ah /var | sort -rh | head -n 20

# Clean PM2 logs
pm2 flush

# Clean old Nginx logs
sudo rm /var/log/nginx/*.log.*.gz

# Clean apt cache
sudo apt clean
```

### Out of Memory

```bash
# Check memory
free -h

# Restart app to free memory
pm2 restart isci-mgmt

# Check PM2 memory usage
pm2 monit
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu /var/www/isci-mgmt-system

# Fix permissions
chmod 755 /var/www/isci-mgmt-system
chmod 644 /var/www/isci-mgmt-system/data/*.json
chmod 755 /var/www/isci-mgmt-system/public/uploads/profiles
```

---

## Useful Commands

### Download File from Server

```bash
# From your local machine
scp -i /path/to/key.pem ubuntu@your-ip:/var/www/isci-mgmt-system/data/isci-codes.json ~/Downloads/
```

### Upload File to Server

```bash
# From your local machine
scp -i /path/to/key.pem ~/local-file.json ubuntu@your-ip:/var/www/isci-mgmt-system/data/
```

### Edit File on Server

```bash
nano /var/www/isci-mgmt-system/data/isci-codes.json
# Or
vim /var/www/isci-mgmt-system/data/isci-codes.json
```

---

## Emergency Procedures

### Complete App Restart

```bash
pm2 delete isci-mgmt
pm2 start ecosystem.config.js
pm2 save
```

### Rollback Deployment

```bash
cd /var/www/isci-mgmt-system
git log --oneline -5              # Find previous commit
git reset --hard COMMIT_HASH      # Rollback code
npm install                       # Reinstall dependencies
npm run build                     # Rebuild
pm2 restart isci-mgmt            # Restart
```

### Reboot Server

```bash
sudo reboot
```

After reboot, PM2 should auto-start the app. Verify with:
```bash
pm2 status
```

---

## Monitoring & Analytics

### Real-time Monitoring

```bash
# Watch logs
pm2 logs isci-mgmt

# Monitor resources
pm2 monit

# Watch Nginx access logs (see traffic)
sudo tail -f /var/log/nginx/isci-mgmt-access.log
```

### Count Requests

```bash
# Total requests today
sudo grep $(date +%d/%b/%Y) /var/log/nginx/isci-mgmt-access.log | wc -l

# Unique IPs today
sudo grep $(date +%d/%b/%Y) /var/log/nginx/isci-mgmt-access.log | awk '{print $1}' | sort -u | wc -l
```

---

## Aliases (Add to ~/.bashrc)

```bash
# Add these to ~/.bashrc for shortcuts
alias app-restart='pm2 restart isci-mgmt'
alias app-logs='pm2 logs isci-mgmt'
alias app-status='pm2 status'
alias app-deploy='cd /var/www/isci-mgmt-system && ./deploy.sh'
alias nginx-reload='sudo systemctl reload nginx'
alias nginx-logs='sudo tail -f /var/log/nginx/isci-mgmt-error.log'

# Reload aliases
source ~/.bashrc
```

---

## Important File Locations

| Item | Location |
|------|----------|
| Application | `/var/www/isci-mgmt-system` |
| Data Files | `/var/www/isci-mgmt-system/data/*.json` |
| Profile Images | `/var/www/isci-mgmt-system/public/uploads/profiles/` |
| PM2 Logs | `/var/www/isci-mgmt-system/logs/pm2-*.log` |
| Nginx Config | `/etc/nginx/sites-available/isci-mgmt` |
| Nginx Logs | `/var/log/nginx/isci-mgmt-*.log` |
| SSL Certificates | `/etc/letsencrypt/live/yourdomain.com/` |
| Backups | `/home/ubuntu/backups/` |

---

## Support

For detailed deployment instructions, see: `AWS_EC2_DEPLOYMENT.md`

**Last Updated**: January 6, 2026
