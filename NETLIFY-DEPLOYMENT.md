# Netlify Test Deployment

⚠️ **WARNING: FOR TESTING PURPOSES ONLY** ⚠️

This deployment configuration is designed for UI/UX testing and demos only. It has significant limitations due to the serverless nature of Netlify.

## Limitations

- ❌ **Data changes will NOT persist** - All edits are lost on redeployment
- ❌ **File uploads will be LOST** - Profile images disappear after each build
- ❌ **JSON files reset** - Data reverts to committed state on every deployment
- ❌ **No persistent storage** - Serverless functions have ephemeral filesystems

## What Works

✅ UI/UX testing
✅ Visual design review
✅ Navigation and routing
✅ Form layouts and interactions
✅ Demo purposes

## What Doesn't Work

❌ Creating/editing ISCI codes (changes lost)
❌ Adding/editing brands or agencies (changes lost)
❌ User management (changes lost)
❌ Profile image uploads (images lost)
❌ Data import/export (changes lost)

## Deployment Steps

### Option 1: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy with warnings
npm run netlify-test

# Deploy to Netlify
netlify deploy --build

# Deploy to production (still testing only!)
netlify deploy --build --prod
```

### Option 2: Deploy via Netlify Dashboard

1. Push this code to GitHub
2. Connect repository to Netlify
3. Build settings are auto-detected from `netlify.toml`
4. Deploy!

## Build Command

The custom build command `npm run netlify-test` displays warnings before building:

```bash
npm run netlify-test
```

This will show prominent warnings about data persistence before building the app.

## For Production Use

To make this production-ready, you MUST:

1. **Migrate to a Database**
   - PostgreSQL, MongoDB, or similar
   - Replace JSON file reads/writes with database queries

2. **Cloud Storage for Uploads**
   - AWS S3, Cloudinary, or similar
   - Store profile images in cloud storage

3. **Deploy to Platform with Persistent Storage**
   - Railway
   - Render
   - DigitalOcean App Platform
   - Fly.io

## Testing the Build Locally

```bash
# Run the test build
npm run netlify-test

# Preview the build
npx netlify-cli dev
```

## Environment Variables

No environment variables are currently needed for testing, but for production you'll need:

- Database connection strings
- Cloud storage credentials
- API keys
- Session secrets

---

**Remember**: This is a testing deployment only. Do not use for production or expect data to persist!
