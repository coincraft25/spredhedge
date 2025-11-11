# Production Deployment Guide

## Critical Issue Identified

Your application works locally but fails in production because environment variables are NOT automatically transferred when using Bolt's publish button.

## The Problem

When Next.js builds a static export (`output: 'export'`), it bakes environment variables into the JavaScript bundle at **build time**. If those variables aren't present during the build, your app connects to placeholder values instead of your real Supabase database.

### What's Happening:

- **Local (Works)**: Reads `.env` file → Connects to real Supabase → Login works
- **Production (Fails)**: No `.env` file → Uses placeholders → Login fails

## Solution: Configure Environment Variables in Your Hosting Platform

### Step 1: Find Your Hosting Platform

When you clicked Bolt's publish button, it deployed your site to one of these:

- **Bolt Hosting**: URL ends with `.bolt.host`
- **Netlify**: URL ends with `.netlify.app`
- **Other**: Check the URL Bolt gave you after publishing

### Step 2: Add Environment Variables

#### For Bolt Hosting (.bolt.host):

Currently, Bolt's native hosting may have limitations with environment variable configuration. Check Bolt's dashboard for environment variable settings.

#### For Netlify (.netlify.app):

1. Go to https://app.netlify.com
2. Find your deployed site
3. Click **Site settings** → **Environment variables**
4. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://qcrgklyyttcbgjkbvzcv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcmdrbHl5dHRjYmdqa2J2emN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MzE4MzksImV4cCI6MjA3NTUwNzgzOX0.WDZrlCrp-VRcF5Go4iG90TFMhH1zc9ul0oNQ2rM_A2Q
```

5. **Important**: Do NOT add `SUPABASE_SERVICE_ROLE_KEY` - it should NEVER be exposed in static exports

#### For Other Platforms:

Look for "Environment Variables", "Build Environment", or "Settings" in your hosting dashboard.

### Step 3: Trigger a New Build

After adding environment variables, you MUST rebuild:

- **In Bolt**: Click the publish button again
- **In Netlify**: Go to **Deploys** → Click **Trigger deploy** → **Deploy site**
- **Other platforms**: Look for "Redeploy", "Rebuild", or similar options

### Step 4: Verify the Fix

1. Open your production site
2. Open browser console (F12 → Console tab)
3. Look for these messages:
   - **Good**: No error messages about Supabase
   - **Bad**: "CRITICAL: Supabase environment variables are not configured!"

4. Try to log in with valid credentials
5. Check the Network tab (F12 → Network):
   - Look for requests to `qcrgklyyttcbgjkbvzcv.supabase.co`
   - If you see `placeholder.supabase.co` instead, the environment variables didn't get baked into the build

## Understanding "Edge" Data Visibility Issue

You mentioned seeing navigation progress data and blog posts in "The Edge" even without authentication. This is EXPECTED behavior because:

1. **Blog posts are public**: The `/blog` page (`app/blog/page.tsx`) fetches published blog posts using `getPublishedBlogPosts()` which is accessible without authentication
2. **Static export behavior**: Some data might be fetched during build time and embedded in the HTML
3. **Client-side rendering**: The blog page uses `'use client'` and fetches data after the page loads

This is NOT a security issue if your blog is meant to be public.

## Why This Happens with Static Exports

Next.js static exports work differently than regular Next.js:

| Feature | Regular Next.js | Static Export |
|---------|----------------|---------------|
| Server-side code | Yes | No |
| API routes | Yes | No |
| Environment variables | Runtime | Build time only |
| Dynamic rendering | Yes | No |
| Authentication | Easy | Requires client-side |

With `output: 'export'`, your entire app is pre-built into HTML/CSS/JS files. Environment variables are replaced with their values during the build process.

## Security Considerations

### Never Expose These:

- `SUPABASE_SERVICE_ROLE_KEY` - This bypasses Row Level Security
- User passwords or secrets
- Private API keys

### Safe to Expose (Already Public):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - The anon key (designed to be public, protected by RLS)

The `NEXT_PUBLIC_` prefix means these variables are baked into your client-side JavaScript bundle and are visible to anyone who inspects your code. This is EXPECTED and safe because Supabase uses Row Level Security (RLS) to protect your data.

## Troubleshooting

### Problem: Still can't log in after adding environment variables

**Solution**: Make sure you triggered a NEW build after adding the variables. The old build doesn't have them.

### Problem: Getting CORS errors

**Solution**: Check Supabase dashboard → Authentication → URL Configuration → Add your production URL to allowed URLs

### Problem: Environment variables not showing up in build

**Solution**:
1. Verify variable names are EXACTLY: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Check for typos in the values
3. Some platforms require you to mark variables as "available during build time"

### Problem: Blog shows data but nothing else works

**Solution**: This confirms your static export is working, but Supabase client can't connect. Follow Step 2 above to add environment variables.

## Next Steps

1. Add environment variables to your hosting platform
2. Trigger a new deployment
3. Check browser console for error messages
4. Try logging in
5. If it still doesn't work, share the error messages from the browser console

## Alternative: Switch to Server-Side Rendering

If you need better environment variable handling and security, consider switching from static export to regular Next.js:

1. Remove `output: 'export'` from `next.config.js`
2. Deploy to Vercel (made by Next.js team) which handles environment variables automatically
3. This gives you API routes, server-side rendering, and runtime environment variables

However, this requires a platform that supports Node.js server-side rendering (like Vercel, not static hosting).
