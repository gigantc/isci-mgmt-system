# Railway Deployment Guide

This app is deployed on Railway with persistent data storage.

## ✅ What Works on Railway

Unlike Netlify, Railway provides a **full Node.js environment** with a **persistent filesystem**:

- ✅ **Data persistence** - ISCI codes, brands, agencies, and users persist between deployments
- ✅ **File uploads** - Profile images are stored and persist
- ✅ **Full SSR support** - React Router v7 works perfectly
- ✅ **JSON file storage** - All data files work as expected

## Current Deployment

- **GitHub Repository**: https://github.com/gigantc/isci-mgmt-system
- **Connected to Railway**: Auto-deploys on every push to `main` branch
- **Plan**: 30-day free trial ($5 credit/month after trial)

## How It Works

### Auto-Deployment

Railway is connected to your GitHub repository. Every time you push to the `main` branch:

1. Railway detects the change
2. Runs `npm run build`
3. Starts the app with `npm start`
4. Deploys to your Railway URL

### Configuration

The `railway.json` file in the root defines:
- Build command: `npm run build`
- Start command: `npm start`
- Restart policy: On failure with 10 max retries

### Environment

Railway automatically:
- Detects Node.js from `package.json`
- Installs dependencies with `npm install`
- Sets `NODE_ENV=production`
- Provides a public URL

## Deployment URLs

Railway provides:
- **Production URL**: `your-app.up.railway.app` (check Railway dashboard)
- **Custom domain**: Can be added in Railway settings

## Data Persistence

### Important Notes

✅ **Data persists** between deployments on Railway
- Your JSON files (`data/*.json`) are preserved
- Uploaded profile images remain intact
- No data loss on redeploy (unlike Netlify)

### Data Location

All data is stored in:
- `/data/isci-codes.json` - ISCI codes
- `/data/brands.json` - Brands/clients
- `/data/agencies.json` - Agencies
- `/data/users.json` - User accounts
- `/public/uploads/profiles/` - Profile images

### Backup Recommendation

While Railway has persistent storage, it's good practice to:
1. Periodically export data using the Reports page
2. Back up JSON files manually
3. Consider migrating to a database for production

## Railway Dashboard

Access your deployment at: https://railway.app/dashboard

From the dashboard you can:
- View deployment logs
- Monitor resource usage
- Configure custom domains
- Set environment variables
- Restart the service
- View metrics and analytics

## Manual Deployment (CLI)

If you want to deploy manually without GitHub:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
railway up

# View logs
railway logs
```

## Environment Variables

Currently, no environment variables are needed. If you add any in the future:

1. Go to Railway dashboard
2. Select your project
3. Go to "Variables" tab
4. Add your environment variables

Common variables you might need later:
- `DATABASE_URL` - When migrating to a database
- `SESSION_SECRET` - For secure sessions
- `UPLOAD_DIR` - Custom upload directory

## Troubleshooting

### Check Deployment Logs

```bash
railway logs
```

Or in the Railway dashboard: Project → Deployments → Click latest → View logs

### Common Issues

**Port Issues**: Railway assigns a `PORT` environment variable. The app should listen on `process.env.PORT || 3000`.

**Build Failures**: Check the build logs in Railway dashboard. Usually npm install or build errors.

**503 Errors**: App may be starting up. Wait 30 seconds and try again.

## Costs

- **Free Trial**: $5 credit (lasts ~30 days for light usage)
- **After Trial**: $5/month minimum
- **Usage-based**: Additional charges for heavy usage (unlikely for this app)

## Migrating to Production Database

When you're ready to move beyond JSON files:

1. Add a PostgreSQL database in Railway (click "New" → "Database" → "PostgreSQL")
2. Railway will provide a `DATABASE_URL` environment variable
3. Update the API routes to use the database instead of JSON files
4. Redeploy

## Support

- Railway Documentation: https://docs.railway.app
- Community: https://discord.gg/railway
- Status: https://status.railway.app

---

**Current Status**: ✅ Deployed and working with persistent data!
