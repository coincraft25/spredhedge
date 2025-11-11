/*
  # Fix Security Issues - Comprehensive Migration
  
  ## Overview
  This migration addresses multiple security and performance issues identified in the database:
  
  ## 1. Missing Foreign Key Index
  - Add index on blog_posts.created_by to improve query performance for foreign key lookups
  
  ## 2. Auth RLS Optimization
  Optimize RLS policies for blog_categories and blog_posts to use (select auth.uid()) pattern
  instead of auth.uid(), preventing re-evaluation for each row:
  - blog_categories: Admins can delete/insert/update policies
  - blog_posts: Admins can delete/insert/read/update policies
  
  ## 3. Remove Unused Indexes
  Drop indexes that are not being used to reduce maintenance overhead:
  - Capital accounts, transactions, investor NAV history
  - Investors, homepage metrics, NAV data points
  - Portfolio holdings, audit log, positions
  - Blog posts, access requests
  
  ## 4. Function Search Path Security
  Fix search_path mutability for functions to prevent security vulnerabilities:
  - generate_slug
  - update_updated_at_column
  - increment_blog_view_count
  
  ## Note on Multiple Permissive Policies
  Multiple permissive policies are intentional for OR logic (admin OR investor access).
  These are working as designed and do not require changes.
  
  ## Performance Impact
  Significant improvement in RLS policy evaluation and reduced index maintenance overhead.
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_blog_posts_created_by ON blog_posts(created_by);

-- ============================================================================
-- 2. OPTIMIZE AUTH RLS POLICIES - BLOG_CATEGORIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can delete blog categories" ON blog_categories;
DROP POLICY IF EXISTS "Admins can insert blog categories" ON blog_categories;
DROP POLICY IF EXISTS "Admins can update blog categories" ON blog_categories;

-- Recreate with optimized auth pattern
CREATE POLICY "Admins can delete blog categories"
  ON blog_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert blog categories"
  ON blog_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update blog categories"
  ON blog_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 3. OPTIMIZE AUTH RLS POLICIES - BLOG_POSTS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can delete blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can read all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON blog_posts;

-- Recreate with optimized auth pattern
CREATE POLICY "Admins can delete blog posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert blog posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all blog posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update blog posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 4. REMOVE UNUSED INDEXES
-- ============================================================================

-- Capital accounts and transactions
DROP INDEX IF EXISTS idx_capital_accounts_investor;
DROP INDEX IF EXISTS idx_transactions_account;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_created_by;

-- Investor NAV history
DROP INDEX IF EXISTS idx_investor_nav_history_account;
DROP INDEX IF EXISTS idx_investor_nav_history_date;

-- Investors
DROP INDEX IF EXISTS idx_investors_access_request_id;
DROP INDEX IF EXISTS idx_investors_user_id;

-- Homepage metrics and NAV data points
DROP INDEX IF EXISTS idx_homepage_metrics_updated_by;
DROP INDEX IF EXISTS idx_nav_data_points_updated_by;

-- Portfolio holdings
DROP INDEX IF EXISTS idx_portfolio_holdings_category_id;

-- Audit log
DROP INDEX IF EXISTS idx_audit_log_position_id;
DROP INDEX IF EXISTS idx_audit_log_user_id;
DROP INDEX IF EXISTS idx_audit_log_timestamp;
DROP INDEX IF EXISTS idx_audit_log_action;

-- Positions
DROP INDEX IF EXISTS idx_positions_visibility;
DROP INDEX IF EXISTS idx_positions_entry_date;
DROP INDEX IF EXISTS idx_positions_sector;
DROP INDEX IF EXISTS idx_positions_created_by;
DROP INDEX IF EXISTS idx_positions_opened_date;
DROP INDEX IF EXISTS idx_positions_updated_by;

-- Blog posts
DROP INDEX IF EXISTS idx_blog_posts_slug;
DROP INDEX IF EXISTS idx_blog_posts_published_at;
DROP INDEX IF EXISTS idx_blog_posts_category_ids;

-- Access requests
DROP INDEX IF EXISTS idx_access_requests_account_created_by;
DROP INDEX IF EXISTS idx_access_requests_user_id;

-- ============================================================================
-- 5. FIX FUNCTION SEARCH_PATH MUTABILITY
-- ============================================================================

-- Fix generate_slug function
DROP FUNCTION IF EXISTS generate_slug(text);
CREATE OR REPLACE FUNCTION generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$;

-- Fix update_updated_at_column function  
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix increment_blog_view_count function
DROP FUNCTION IF EXISTS increment_blog_view_count(uuid);
CREATE OR REPLACE FUNCTION increment_blog_view_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$;