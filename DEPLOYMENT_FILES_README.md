# Deployment Files Overview

This document explains the deployment-related files created for AWS EC2 deployment.

> **Deployment Status**: These files have been prepared and reviewed but not yet deployed to a live AWS EC2 instance. All configurations are production-ready and follow best practices.

## Files Created

### 1. `AWS_EC2_DEPLOYMENT.md`
**Comprehensive deployment guide** with step-by-step instructions.

**Covers:**
- EC2 instance setup and configuration
- Installing Node.js, PM2, Nginx, and other dependencies
- Application deployment process
- PM2 process manager setup
- Nginx reverse proxy configuration
- SSL certificate setup with Let's Encrypt
- Security group and firewall configuration
- Automated deployment setup
- Backup strategies
- Monitoring and maintenance
- Troubleshooting common issues
- Cost estimation

**When to use:** Follow this guide when setting up the app on AWS EC2 for the first time, or as a reference for any deployment-related tasks.

---

### 2. `ecosystem.config.js`
**PM2 process manager configuration file.**

**Purpose:** Defines how PM2 should run and manage the Node.js application process.

**Features:**
- Cluster mode for load balancing (configurable)
- Auto-restart on crashes
- Memory-based restart (500MB threshold)
- Log file configuration
- Graceful start/shutdown
- Environment variables

**Usage:**
```bash
pm2 start ecosystem.config.js
pm2 restart isci-mgmt
pm2 logs isci-mgmt
```

**Note:** This file should be copied to the server during deployment.

---

### 3. `nginx.conf`
**Nginx web server configuration file.**

**Purpose:** Configures Nginx as a reverse proxy in front of the Node.js application.

**Features:**
- HTTP to HTTPS redirect
- SSL/TLS configuration
- Static file serving (assets, uploads)
- Proxy configuration for Node.js app
- Security headers
- Gzip compression
- WebSocket support (ready for future use)
- Request timeouts and buffering

**Server Setup:**
```bash
# Copy to Nginx sites directory
sudo cp nginx.conf /etc/nginx/sites-available/isci-mgmt

# Create symlink
sudo ln -s /etc/nginx/sites-available/isci-mgmt /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**Important:** Replace ALL instances of `yourdomain.com` with your actual domain before deploying! Look for TODO comments in the file.

---

### 4. `deploy.sh`
**Automated deployment script.**

**Purpose:** Automates the deployment process to reduce errors and save time.

**Process:**
1. Pulls latest code from Git
2. Installs npm dependencies
3. Backs up data files
4. Builds the application
5. Sets up logs directory
6. Restarts PM2 process
7. Displays status and recent logs
8. Cleans up old backups (7+ days)

**Usage:**
```bash
cd /var/www/isci-mgmt-system
./deploy.sh
```

**Benefits:**
- Consistent deployment process
- Automatic backups before deployment
- Error handling (exits on failure)
- Color-coded output for easy reading
- Works for both initial and subsequent deployments

**Note:** Make executable with `chmod +x deploy.sh`

---

### 5. `AWS_QUICK_REFERENCE.md`
**Quick reference guide for common operations.**

**Purpose:** Provides fast access to frequently used commands for daily operations.

**Includes:**
- SSH connection
- Application management (deploy, restart)
- PM2 commands (status, logs, monitoring)
- Nginx commands (reload, logs)
- SSL certificate management
- System monitoring (disk, memory, CPU)
- Data backup and restore
- Git operations
- Troubleshooting procedures
- Emergency procedures
- Useful aliases

**When to use:** Keep this open for quick reference while managing the production server.

---

### 6. `.gitignore` (Updated)
Added `/logs/` directory to gitignore to prevent server-side PM2 logs from being committed to the repository.

---

## Deployment Workflow

### Initial Setup (First Time)

1. Follow `AWS_EC2_DEPLOYMENT.md` completely
2. Set up EC2 instance
3. Install dependencies
4. Copy `ecosystem.config.js` and `nginx.conf` to server
5. Run initial deployment
6. Configure SSL
7. Set up automated backups

### Subsequent Deployments (Updates)

1. SSH into server
2. Run `./deploy.sh`
3. Verify deployment with `pm2 status` and `pm2 logs`

### Daily Operations

1. Use `AWS_QUICK_REFERENCE.md` for common tasks
2. Monitor logs: `pm2 logs isci-mgmt`
3. Check status: `pm2 status`
4. Deploy updates: `./deploy.sh`

---

## Architecture Overview

```
Internet
    ↓
[AWS Security Group - Firewall]
    ↓
[Nginx :80, :443] ← Let's Encrypt SSL
    ↓
[Node.js App :3000] ← PM2 Process Manager
    ↓
[File System]
    ├── data/*.json (ISCI codes, brands, users)
    └── public/uploads/profiles/ (profile images)
```

**Traffic Flow:**
1. User requests → `https://yourdomain.com`
2. Nginx receives HTTPS request on port 443
3. Nginx proxies to Node.js app on port 3000
4. App processes request and returns response
5. Nginx sends response back to user

**Process Management:**
- PM2 keeps Node.js app running
- Auto-restarts on crashes
- Logs all output
- Survives server reboots (via startup script)

---

## File Locations on Server

| File | Local (Development) | Server (Production) |
|------|---------------------|---------------------|
| Application | `/Users/danf/Sites/dev/isci-mgmt-system` | `/var/www/isci-mgmt-system` |
| PM2 Config | `ecosystem.config.js` | `/var/www/isci-mgmt-system/ecosystem.config.js` |
| Nginx Config | `nginx.conf` | `/etc/nginx/sites-available/isci-mgmt` |
| Deploy Script | `deploy.sh` | `/var/www/isci-mgmt-system/deploy.sh` |
| PM2 Logs | N/A | `/var/www/isci-mgmt-system/logs/` |
| Nginx Logs | N/A | `/var/log/nginx/isci-mgmt-*.log` |
| Data Files | `data/*.json` | `/var/www/isci-mgmt-system/data/*.json` |
| Profile Images | `public/uploads/profiles/` | `/var/www/isci-mgmt-system/public/uploads/profiles/` |
| Backups | N/A | `/home/ubuntu/backups/` |

---

## Important Notes

### Before Deployment

1. **Replace placeholders** in `nginx.conf`:
   - Change `yourdomain.com` to your actual domain
   - Update SSL certificate paths after Let's Encrypt setup

2. **Update Git remote** if needed:
   ```bash
   git remote -v
   git remote set-url origin https://github.com/yourusername/isci-mgmt-system.git
   ```

3. **Test locally** before deploying:
   ```bash
   npm run build
   npm run preview
   ```

### Security Checklist

- [ ] EC2 Security Group restricts SSH to your IP only
- [ ] Firewall (UFW) configured and enabled
- [ ] SSL certificates installed and auto-renewing
- [ ] Root login disabled
- [ ] Strong passwords for all user accounts
- [ ] Data backups configured (daily recommended)
- [ ] PM2 logs rotated to prevent disk space issues

### Monitoring

Set up monitoring for:
- Disk space usage (alert at 80%)
- Memory usage (alert at 80%)
- Application uptime
- SSL certificate expiration (auto-renews, but monitor)
- Backup success/failure

---

## Next Steps After Deployment

1. **Set up monitoring**: CloudWatch, Datadog, or similar
2. **Configure alerts**: Email/SMS for downtime or errors
3. **Set up CI/CD**: GitHub Actions for automated deployments
4. **Database migration**: Move from JSON to PostgreSQL/MySQL
5. **CDN setup**: CloudFront for static assets
6. **Load balancing**: Multiple EC2 instances behind ELB
7. **Auto-scaling**: Scale based on traffic

---

## Troubleshooting Resources

If you encounter issues:

1. Check `AWS_EC2_DEPLOYMENT.md` Troubleshooting section
2. Use `AWS_QUICK_REFERENCE.md` for common commands
3. Check PM2 logs: `pm2 logs isci-mgmt --err`
4. Check Nginx logs: `sudo tail -f /var/log/nginx/isci-mgmt-error.log`
5. Verify service status: `pm2 status` and `sudo systemctl status nginx`

---

## Support

For questions or issues:
- AWS Documentation: https://docs.aws.amazon.com/
- PM2 Documentation: https://pm2.keymetrics.io/docs/
- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

---

**Last Updated**: January 6, 2026
