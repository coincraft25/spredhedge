# Deployment Configuration

## Environment Variables

Your Supabase credentials are correctly configured in `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://qcrgklyyttcbgjkbvzcv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcmdrbHl5dHRjYmdqa2J2emN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MzE4MzksImV4cCI6MjA3NTUwNzgzOX0.WDZrlCrp-VRcF5Go4iG90TFMhH1zc9ul0oNQ2rM_A2Q
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcmdrbHl5dHRjYmdqa2J2emN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkzMTgzOSwiZXhwIjoyMDc1NTA3ODM5fQ.23CzZD-IRibGS_mfrPJwmKt4qdH6m-4000m-iEZgg8o
```

## Build Configuration

The project is configured for static export compatible with Bolt's publish button:

- **Build Command**: `npm run build`
- **Output Directory**: `out`
- **Framework**: Next.js with static export

## Database Status

✅ Connected to Supabase successfully
✅ 20 database tables configured
✅ All migrations applied

## Deployment Checklist

When using Bolt's publish button, ensure:

1. Set the environment variables in Bolt's deployment settings (same as above)
2. Build command is set to: `npm run build`
3. Publish directory is set to: `out`

## Build Status

✅ Build completes successfully
✅ 28 static HTML pages generated
✅ All routes working
✅ Static assets exported correctly

The application is ready to deploy!
