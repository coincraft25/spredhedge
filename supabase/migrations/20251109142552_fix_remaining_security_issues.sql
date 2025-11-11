/*
  # Fix Remaining Security Issues

  ## Overview
  This migration addresses the remaining security and performance issues identified in the database audit.

  ## Changes Made

  ### 1. Add Missing Foreign Key Index
  - **blog_posts.created_by**: Missing index on foreign key to auth.users
    - Impact: Improves join performance when querying blog posts with user information
    - Creates: `idx_blog_posts_created_by`

  ### 2. Optimize RLS Policies with (select auth.uid())
  The following tables have SELECT policies that re-evaluate `auth.uid()` for each row.
  Fixed by replacing `auth.uid()` with `(select auth.uid())` to evaluate once per query:

  - **investors** - "Users can view investors" policy
  - **capital_accounts** - "Users can view capital accounts" policy  
  - **transactions** - "Users can view transactions" policy
  - **investor_nav_history** - "Users can view investor NAV history" policy
  - **positions** - "Users can view positions" policy
  - **blog_posts** - "Authenticated users can read blog posts" policy

  ### 3. Remove Unused Indexes
  The following indexes were created but are not being used by any queries.
  Removing them improves write performance and reduces storage:

  - idx_capital_accounts_investor_id
  - idx_transactions_capital_account_id
  - idx_transactions_created_by
  - idx_investors_user_id
  - idx_investors_access_request_id
  - idx_homepage_metrics_updated_by
  - idx_nav_data_points_updated_by
  - idx_portfolio_holdings_category_id
  - idx_audit_log_position_id
  - idx_audit_log_user_id
  - idx_positions_created_by
  - idx_positions_updated_by
  - idx_access_requests_account_created_by
  - idx_access_requests_user_id

  **Note**: These indexes were added in previous migrations but analysis shows they're not used.
  If usage patterns change in the future, they can be re-added.

  ### 4. Leaked Password Protection
  **IMPORTANT**: This must be enabled manually in Supabase Dashboard:
  1. Go to Authentication > Settings
  2. Find "Leaked Password Protection"  
  3. Enable the toggle

  This feature checks passwords against the HaveIBeenPwned database to prevent use of compromised passwords.

  ## Performance Impact
  - **RLS Optimization**: Significant improvement on queries with many rows (10x-100x faster)
  - **Index Addition**: Faster joins on blog_posts by created_by
  - **Index Removal**: Improved write performance, reduced storage overhead

  ## Security Impact
  - **RLS Performance**: Prevents potential DoS via slow policy evaluation
  - **Password Protection**: Requires manual dashboard enable (see above)
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEX
-- ============================================================================

-- Add index on blog_posts.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_by 
  ON blog_posts(created_by);

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - Replace auth.uid() with (select auth.uid())
-- ============================================================================

-- INVESTORS TABLE
-- Fix "Users can view investors" policy
DROP POLICY IF EXISTS "Users can view investors" ON investors;

CREATE POLICY "Users can view investors"
  ON investors FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    -- Users can view their own investor record
    (user_id = (select auth.uid()))
  );

-- CAPITAL_ACCOUNTS TABLE  
-- Fix "Users can view capital accounts" policy
DROP POLICY IF EXISTS "Users can view capital accounts" ON capital_accounts;

CREATE POLICY "Users can view capital accounts"
  ON capital_accounts FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    -- Investors can view their own
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.user_id = (select auth.uid())
      AND investors.id = capital_accounts.investor_id
    )
  );

-- TRANSACTIONS TABLE
-- Fix "Users can view transactions" policy
DROP POLICY IF EXISTS "Users can view transactions" ON transactions;

CREATE POLICY "Users can view transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    -- Investors can view their own transactions
    EXISTS (
      SELECT 1 FROM investors
      JOIN capital_accounts ON capital_accounts.investor_id = investors.id
      WHERE investors.user_id = (select auth.uid())
      AND capital_accounts.id = transactions.capital_account_id
    )
  );

-- INVESTOR_NAV_HISTORY TABLE
-- Fix "Users can view investor NAV history" policy
DROP POLICY IF EXISTS "Users can view investor NAV history" ON investor_nav_history;

CREATE POLICY "Users can view investor NAV history"
  ON investor_nav_history FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    -- Investors can view their own
    EXISTS (
      SELECT 1 FROM investors
      JOIN capital_accounts ON capital_accounts.investor_id = investors.id
      WHERE investors.user_id = (select auth.uid())
      AND capital_accounts.id = investor_nav_history.capital_account_id
    )
  );

-- POSITIONS TABLE
-- Fix "Users can view positions" policy
DROP POLICY IF EXISTS "Users can view positions" ON positions;

CREATE POLICY "Users can view positions"
  ON positions FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    -- Others can only view published live positions
    (visibility = 'members_view' AND status = 'Live')
  );

-- BLOG_POSTS TABLE
-- Fix "Authenticated users can read blog posts" policy
DROP POLICY IF EXISTS "Authenticated users can read blog posts" ON blog_posts;

CREATE POLICY "Authenticated users can read blog posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (
    -- Admin can read all posts
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
    OR
    -- Others can only read published posts
    (status = 'published')
  );

-- ============================================================================
-- 3. REMOVE UNUSED INDEXES
-- ============================================================================

-- These indexes were added but analysis shows they are not being used by queries
-- Removing them improves write performance and reduces storage overhead

DROP INDEX IF EXISTS idx_capital_accounts_investor_id;
DROP INDEX IF EXISTS idx_transactions_capital_account_id;
DROP INDEX IF EXISTS idx_transactions_created_by;
DROP INDEX IF EXISTS idx_investors_user_id;
DROP INDEX IF EXISTS idx_investors_access_request_id;
DROP INDEX IF EXISTS idx_homepage_metrics_updated_by;
DROP INDEX IF EXISTS idx_nav_data_points_updated_by;
DROP INDEX IF EXISTS idx_portfolio_holdings_category_id;
DROP INDEX IF EXISTS idx_audit_log_position_id;
DROP INDEX IF EXISTS idx_audit_log_user_id;
DROP INDEX IF EXISTS idx_positions_created_by;
DROP INDEX IF EXISTS idx_positions_updated_by;
DROP INDEX IF EXISTS idx_access_requests_account_created_by;
DROP INDEX IF EXISTS idx_access_requests_user_id;
