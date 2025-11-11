# SpredHedge Database Migration Guide

## Overview

This guide will walk you through applying all database migrations to your new Supabase project `ruroesbgvpdjrlaenndq`. The complete migration file combines all 25 individual migration files into a single comprehensive SQL script.

## Prerequisites

- Access to Supabase Dashboard for project: `ruroesbgvpdjrlaenndq`
- Project URL: `https://ruroesbgvpdjrlaenndq.supabase.co`
- Environment variables have been updated in `.env` file

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `ruroesbgvpdjrlaenndq`
3. In the left sidebar, click on "SQL Editor"
4. Click "New query" to create a new SQL query window

## Step 2: Apply the Complete Migration

1. Open the file `complete-migration.sql` in your project root directory
2. Copy ALL contents of the file (3,561 lines)
3. Paste the entire SQL script into the Supabase SQL Editor
4. Click "Run" button at the bottom right
5. Wait for the migration to complete (should take 10-30 seconds)

## Step 3: Verify Migration Success

After running the migration, verify that all tables were created successfully:

1. In Supabase Dashboard, go to "Table Editor" in the left sidebar
2. You should see these tables created:
   - `profiles` - User accounts and roles
   - `investors` - Approved investor records
   - `access_requests` - Public access form submissions
   - `allocations` - Fund allocation categories
   - `holdings` - Detailed position holdings
   - `wallets` - Blockchain wallet addresses
   - `nav_history` - Historical NAV records
   - `performance_metrics` - Performance calculations
   - `reports` - Monthly PDF reports
   - `homepage_metrics` - Homepage statistics
   - `nav_data_points` - NAV chart data points
   - `portfolio_holdings` - Investor portfolio data
   - `investor_capital_accounts` - Capital account tracking
   - `positions` - Trading positions
   - `audit_log` - System audit trail
   - `blog_posts` - Blog content
   - `blog_categories` - Blog organization

3. Go to "Storage" in the left sidebar
4. You should see these buckets created:
   - `reports` - For PDF report files
   - `blog-images` - For blog cover images

## Step 4: Verify Application Connection

1. The development server should automatically restart with the new environment variables
2. Visit your application at `http://localhost:3000`
3. The homepage should load without errors
4. Navigate to `/api/diagnostic` to verify connection status
5. You should see:
   - `is_correct_project: true`
   - `verdict: "✅ CORRECT - Connected to NEW project"`
   - List of all created tables

## Step 5: Create Your First Admin User

Now that the database is set up, you need to create an admin user:

### Option A: Create Admin via Sign Up

1. Go to your app's login page: `http://localhost:3000/login`
2. Click "Sign Up" or go to the registration form
3. Create your account with email and password
4. After signup, you'll need to get your user UUID

### Get Your User UUID

1. Go to Supabase Dashboard > Authentication > Users
2. Find your newly created user
3. Copy the UUID (it looks like: `550e8400-e29b-41d4-a716-446655440000`)

### Promote User to Admin

1. Go back to Supabase Dashboard > SQL Editor
2. Run this SQL query (replace `YOUR_UUID_HERE` with your actual UUID):

```sql
-- Replace YOUR_UUID_HERE with your actual user UUID
-- Replace 'Your Name' with your actual name

INSERT INTO profiles (id, full_name, role)
VALUES ('YOUR_UUID_HERE', 'Your Name', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

3. Click "Run"
4. Log out and log back in to your application
5. You should now have access to all admin routes:
   - `/admin/homepage` - Manage homepage metrics
   - `/admin/investors` - Manage investors
   - `/admin/positions` - Manage positions
   - `/admin/blog` - Manage blog posts
   - `/admin/reports` - Upload reports
   - And more...

## Step 6: Verify Seed Data

The migration includes some initial seed data. Verify it was created:

1. Check homepage metrics:
   - Go to: `http://localhost:3000`
   - You should see metrics: $12.4M AUM, +24.3% return, etc.

2. Check allocations:
   - Visit the allocations section
   - You should see 4 categories: Digital Reserve (40%), Structured Yield (25%), Strategic Ventures (20%), Liquidity Buffer (15%)

3. Check NAV data:
   - The homepage should display a NAV chart
   - Data points from May to October should be visible

4. Check blog categories:
   - Go to blog section
   - You should see 8 categories: Macro Signals, Playbook, Strategy, etc.

## What Gets Created

### Database Tables

**Core User Tables:**
- `profiles` - User profiles with role-based access (admin/investor)
- `investors` - Approved investor records linked to user accounts
- `access_requests` - Public access form submissions (no auth required)

**Financial Data Tables:**
- `allocations` - Fund allocation breakdown by category
- `holdings` - Detailed holdings within each category
- `portfolio_holdings` - Individual investor portfolio data
- `positions` - Trading positions with entry/exit tracking
- `nav_history` - Historical NAV data points
- `performance_metrics` - Calculated performance metrics

**Capital Management:**
- `investor_capital_accounts` - Capital account tracking
- `audit_log` - Complete audit trail of all actions

**Transparency:**
- `wallets` - Blockchain wallet addresses for transparency

**Content Management:**
- `blog_posts` - Rich blog post system with categories
- `blog_categories` - Blog organization and categorization
- `reports` - Monthly PDF reports with metadata

**Homepage:**
- `homepage_metrics` - Dynamic homepage statistics (AUM, returns, etc.)
- `nav_data_points` - NAV chart data for homepage

### Storage Buckets

- `reports` - For storing monthly PDF reports
- `blog-images` - For storing blog cover images and inline images

### Security Features

All tables have Row Level Security (RLS) enabled with policies for:
- Public read access for landing page data
- Authenticated read access for investor data
- Admin-only write access for management operations
- User-specific access for personal data

### Database Functions

- `increment_blog_view_count()` - Safely increment blog post view counts
- Various triggers and indexes for performance optimization

## Troubleshooting

### Issue: "relation does not exist" errors

**Solution:** The migration didn't complete successfully. Re-run the complete migration SQL script.

### Issue: Can't log in after creating account

**Solution:** Make sure you've created a profile entry in the `profiles` table using the SQL script in Step 5.

### Issue: Permission denied errors

**Solution:** Ensure you've promoted your user to admin role using the SQL script in Step 5.

### Issue: Homepage shows no data

**Solution:** The seed data may not have been inserted. Check if the migration completed without errors. You can manually insert data using the Supabase Table Editor.

### Issue: Storage bucket errors

**Solution:** Verify storage buckets were created in Supabase Dashboard > Storage. RLS policies must be properly configured.

### Issue: Connection still shows old project

**Solution:**
1. Verify `.env` file has correct credentials for `ruroesbgvpdjrlaenndq`
2. Restart the development server completely
3. Clear browser cache and cookies
4. Check `/api/diagnostic` endpoint

## Next Steps

After successful migration:

1. **Test Access Request Form**
   - Go to `/request-access`
   - Submit a test access request
   - Log in as admin and verify it appears in `/admin/requests`

2. **Configure Homepage Metrics**
   - Go to `/admin/homepage`
   - Update AUM, returns, and other metrics
   - Verify changes appear on homepage

3. **Add NAV Data**
   - Update NAV data points for the chart
   - Verify chart displays correctly on homepage

4. **Create Blog Post**
   - Go to `/admin/blog`
   - Create your first blog post
   - Publish and view on public blog page

5. **Upload Reports**
   - Go to `/admin/reports`
   - Upload monthly PDF reports
   - Verify investors can download them

6. **Add Investors**
   - Create investor accounts through `/admin/investors`
   - Set up capital accounts
   - Track positions and performance

## Support

If you encounter any issues:

1. Check the browser console for JavaScript errors
2. Check Supabase Dashboard > Logs for database errors
3. Verify all environment variables are correct
4. Visit `/api/diagnostic` for detailed connection information
5. Review the complete migration SQL for any errors

## Summary

Your SpredHedge database is now fully configured with:
- 17 database tables with comprehensive RLS policies
- 2 storage buckets for file management
- Seed data for immediate functionality
- Secure role-based access control
- Complete audit trail system
- Blog platform with categorization
- Investor portal with capital tracking
- Transparent position management

You're ready to start using your SpredHedge investor portal!
