# AWS EC2 Deployment Guide for ISCI Management System

This guide walks you through deploying the ISCI Management System to an AWS EC2 instance.

## Prerequisites

- AWS account with EC2 access
- Domain name (optional, but recommended)
- SSH client (Terminal on macOS/Linux, PuTTY on Windows)
- Basic familiarity with Linux commands

## Table of Contents

1. [Launch EC2 Instance](#1-launch-ec2-instance)
2. [Connect to Instance](#2-connect-to-instance)
3. [Install Dependencies](#3-install-dependencies)
4. [Deploy Application](#4-deploy-application)
5. [Configure PM2 Process Manager](#5-configure-pm2-process-manager)
6. [Configure Nginx Reverse Proxy](#6-configure-nginx-reverse-proxy)
7. [Set Up SSL with Let's Encrypt](#7-set-up-ssl-with-lets-encrypt)
8. [Configure Security Groups](#8-configure-security-groups)
9. [Set Up Automated Deployments](#9-set-up-automated-deployments)
10. [Backup Strategy](#10-backup-strategy)

---

## 1. Launch EC2 Instance

### Step 1: Create Instance

1. Log into AWS Console → EC2 Dashboard
2. Click "Launch Instance"
3. Configure:
   - **Name**: `isci-mgmt-production`
   - **AMI**: Ubuntu Server 22.04 LTS (free tier eligible)
   - **Instance Type**: `t2.small` or `t3.small` (minimum recommended)
     - t2.micro (free tier) may be too small for build process
   - **Key Pair**: Create new or select existing (download .pem file!)
   - **Storage**: 20 GB gp3 (minimum)

### Step 2: Configure Security Group

Create security group with these inbound rules:

| Type  | Protocol | Port | Source    | Description        |
|-------|----------|------|-----------|--------------------|
| SSH   | TCP      | 22   | Your IP   | SSH access         |
| HTTP  | TCP      | 80   | 0.0.0.0/0 | Web traffic        |
| HTTPS | TCP      | 443  | 0.0.0.0/0 | Secure web traffic |

**Important**: Change SSH source from 0.0.0.0/0 to "My IP" for security!

### Step 3: Allocate Elastic IP (Optional but Recommended)

1. EC2 Dashboard → Elastic IPs → Allocate Elastic IP
2. Associate with your instance
3. This prevents IP changes on instance restart

---

## 2. Connect to Instance

### macOS/Linux

```bash
# Set correct permissions for key file
chmod 400 /path/to/your-key.pem

# Connect via SSH
ssh -i /path/to/your-key.pem ubuntu@your-instance-ip
```

### Windows

Use PuTTY with .ppk key file (convert .pem using PuTTYgen)

---

## 3. Install Dependencies

Once connected to your EC2 instance:

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install PM2 globally (process manager)
sudo npm install -g pm2

# Install Nginx (web server)
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Optional: Install build essentials (for native modules)
sudo apt install -y build-essential
```

---

## 4. Deploy Application

### Step 1: Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www
cd /var/www

# Clone your repository
sudo git clone https://github.com/yourusername/isci-mgmt-system.git
cd isci-mgmt-system

# Set ownership to ubuntu user
sudo chown -R ubuntu:ubuntu /var/www/isci-mgmt-system
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build Application

```bash
npm run build
```

This creates the production build in `build/` directory.

### Step 4: Set Up Data Directories

```bash
# Ensure data directory has correct permissions
chmod 755 data
chmod 644 data/*.json

# Ensure uploads directory exists
mkdir -p public/uploads/profiles
chmod 755 public/uploads/profiles
```

### Step 5: Configure Environment

Create `.env` file if needed (currently app doesn't use env vars, but good practice):

```bash
nano .env
```

Add:
```
NODE_ENV=production
PORT=3000
```

---

## 5. Configure PM2 Process Manager

PM2 keeps your app running, restarts on crashes, and manages logs.

### Step 1: Create PM2 Ecosystem File

Create `ecosystem.config.js` in project root (see separate file).

### Step 2: Start Application with PM2

```bash
# Start app using ecosystem file
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs isci-mgmt

# Monitor in real-time
pm2 monit
```

### Step 3: Configure PM2 Startup

This ensures your app restarts on server reboot:

```bash
# Generate startup script
pm2 startup

# Copy and run the command it outputs (it will look like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Save current PM2 process list
pm2 save
```

### Useful PM2 Commands

```bash
pm2 restart isci-mgmt    # Restart app
pm2 stop isci-mgmt       # Stop app
pm2 delete isci-mgmt     # Remove from PM2
pm2 logs isci-mgmt       # View logs
pm2 logs --lines 100     # View last 100 log lines
pm2 flush                # Clear log files
```

---

## 6. Configure Nginx Reverse Proxy

Nginx sits in front of your Node.js app and handles incoming HTTP/HTTPS requests.

### Step 1: Create Nginx Configuration

Create `nginx.conf` (see separate file) and copy to server:

```bash
sudo nano /etc/nginx/sites-available/isci-mgmt
```

Paste the nginx configuration.

### Step 2: Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/isci-mgmt /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 3: Test

Visit `http://your-instance-ip` - you should see your app!

---

## 7. Set Up SSL with Let's Encrypt

### Step 1: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Obtain Certificate

**Prerequisites**: Your domain must point to your EC2 instance IP!

```bash
# Replace with your domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts:
- Enter email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Step 3: Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

Certbot automatically sets up a cron job to renew certificates.

### Step 4: Verify

Visit `https://yourdomain.com` - you should see the lock icon!

---

## 8. Configure Security Groups

### Finalize Security Rules

Now that SSL is set up, update your security group:

1. AWS Console → EC2 → Security Groups
2. Select your instance's security group
3. Inbound rules should be:

| Type  | Port | Source    | Description |
|-------|------|-----------|-------------|
| SSH   | 22   | Your IP   | SSH only from your IP |
| HTTP  | 80   | 0.0.0.0/0 | Redirects to HTTPS |
| HTTPS | 443  | 0.0.0.0/0 | Secure web traffic |

### Additional Security Hardening

```bash
# Enable firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

---

## 9. Set Up Automated Deployments

Create a deployment script for easy updates.

### Step 1: Create Deploy Script

See `deploy.sh` (separate file).

### Step 2: Make Executable

```bash
chmod +x deploy.sh
```

### Step 3: Deploy Updates

```bash
./deploy.sh
```

### GitHub Actions (Optional)

For automatic deployments on push, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /var/www/isci-mgmt-system
            ./deploy.sh
```

Add secrets in GitHub repo settings:
- `EC2_HOST`: Your instance IP or domain
- `EC2_SSH_KEY`: Contents of your .pem file

---

## 10. Backup Strategy

### Automated Data Backups

Create a backup script:

```bash
nano ~/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/var/www/isci-mgmt-system"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup data files
tar -czf $BACKUP_DIR/data_$DATE.tar.gz \
  $APP_DIR/data/*.json \
  $APP_DIR/public/uploads/profiles/*

# Keep only last 7 days of backups
find $BACKUP_DIR -name "data_*.tar.gz" -mtime +7 -delete

echo "Backup completed: data_$DATE.tar.gz"
```

Make executable:
```bash
chmod +x ~/backup.sh
```

### Schedule Daily Backups

```bash
crontab -e
```

Add:
```
0 2 * * * /home/ubuntu/backup.sh >> /home/ubuntu/backup.log 2>&1
```

This runs daily at 2 AM.

### S3 Backups (Recommended)

Install AWS CLI and sync backups to S3:

```bash
sudo apt install -y awscli
aws configure  # Enter your AWS credentials

# Add to backup script:
aws s3 sync /home/ubuntu/backups s3://your-backup-bucket/isci-mgmt/
```

---

## Monitoring & Maintenance

### View Application Logs

```bash
pm2 logs isci-mgmt
pm2 logs --lines 100
```

### View Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Disk Space

```bash
df -h
```

### Check Memory Usage

```bash
free -h
pm2 monit
```

### Update Application

```bash
cd /var/www/isci-mgmt-system
./deploy.sh
```

---

## Troubleshooting

### App Won't Start

```bash
# Check PM2 logs
pm2 logs isci-mgmt --err

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart isci-mgmt
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Out of Memory

```bash
# Check memory
free -h

# Consider upgrading instance type or adding swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### SSL Certificate Issues

```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## Cost Estimation

**Monthly AWS Costs (approximate)**:

- **t3.small instance**: ~$15/month
- **20 GB storage**: ~$2/month
- **Elastic IP**: Free (when attached)
- **Data transfer**: ~$0.09/GB (first 100GB/month free)

**Total**: ~$17-25/month depending on traffic

**Tip**: Use AWS Cost Explorer to monitor actual costs.

---

## Next Steps

1. **Database Migration**: Consider moving from JSON files to PostgreSQL or MongoDB
2. **CDN**: Use CloudFront for static assets
3. **Monitoring**: Set up CloudWatch or third-party monitoring
4. **Load Balancing**: Add ELB for high availability (multi-instance)
5. **Auto Scaling**: Configure auto-scaling groups for traffic spikes
6. **CI/CD**: Implement full GitHub Actions pipeline

---

## Support Resources

- **AWS EC2 Documentation**: https://docs.aws.amazon.com/ec2/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/

---

**Last Updated**: January 6, 2026
