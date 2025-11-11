/*
  # Fix Database Security Issues Properly

  ## Overview
  This migration addresses critical security and performance issues identified in the database audit.

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  Foreign keys without indexes cause poor query performance. Adding indexes for:
  - access_requests: account_created_by, user_id
  - audit_log: position_id, user_id
  - capital_accounts: investor_id
  - homepage_metrics: updated_by
  - investors: access_request_id, user_id
  - nav_data_points: updated_by
  - portfolio_holdings: category_id
  - positions: created_by, updated_by
  - transactions: capital_account_id, created_by

  ### 2. Remove Unused Index
  - idx_blog_posts_created_by: This index was added but never used in queries

  ### 3. Consolidate Multiple Permissive Policies
  Tables with multiple permissive SELECT policies are inefficient. Consolidating into single policies with OR logic:
  - blog_posts: Combine admin + public read policies
  - capital_accounts: Combine admin + investor policies
  - investor_nav_history: Combine admin + investor policies
  - investors: Combine admin + self-read policies
  - portfolio_categories: Combine admin + public policies
  - portfolio_holdings: Combine admin + public policies
  - positions: Combine admin + public policies
  - transactions: Combine admin + investor policies

  ### 4. Password Leak Protection
  Note: Leaked password protection must be enabled in Supabase Dashboard under Authentication > Settings.
  This cannot be enabled via SQL migration.

  ## Security Impact
  - Improved query performance on foreign key lookups
  - Simplified RLS policy evaluation
  - Reduced policy overhead
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Access requests foreign key indexes
CREATE INDEX IF NOT EXISTS idx_access_requests_account_created_by 
  ON access_requests(account_created_by);
CREATE INDEX IF NOT EXISTS idx_access_requests_user_id 
  ON access_requests(user_id);

-- Audit log foreign key indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_position_id 
  ON audit_log(position_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id 
  ON audit_log(user_id);

-- Capital accounts foreign key index
CREATE INDEX IF NOT EXISTS idx_capital_accounts_investor_id 
  ON capital_accounts(investor_id);

-- Homepage metrics foreign key index
CREATE INDEX IF NOT EXISTS idx_homepage_metrics_updated_by 
  ON homepage_metrics(updated_by);

-- Investors foreign key indexes
CREATE INDEX IF NOT EXISTS idx_investors_access_request_id 
  ON investors(access_request_id);
CREATE INDEX IF NOT EXISTS idx_investors_user_id 
  ON investors(user_id);

-- NAV data points foreign key index
CREATE INDEX IF NOT EXISTS idx_nav_data_points_updated_by 
  ON nav_data_points(updated_by);

-- Portfolio holdings foreign key index
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_category_id 
  ON portfolio_holdings(category_id);

-- Positions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_positions_created_by 
  ON positions(created_by);
CREATE INDEX IF NOT EXISTS idx_positions_updated_by 
  ON positions(updated_by);

-- Transactions foreign key indexes
CREATE INDEX IF NOT EXISTS idx_transactions_capital_account_id 
  ON transactions(capital_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by 
  ON transactions(created_by);

-- ============================================================================
-- 2. REMOVE UNUSED INDEX
-- ============================================================================

DROP INDEX IF EXISTS idx_blog_posts_created_by;

-- ============================================================================
-- 3. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- Blog posts: Consolidate admin + public read policies
DROP POLICY IF EXISTS "Admins can read all blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can read published blog posts" ON blog_posts;

CREATE POLICY "Authenticated users can read blog posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (
    -- Admin can read all posts
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Others can only read published posts
    (status = 'published')
  );

-- Capital accounts: Consolidate admin + investor policies
DROP POLICY IF EXISTS "Admins can view all capital accounts" ON capital_accounts;
DROP POLICY IF EXISTS "Investors can view own capital account" ON capital_accounts;

CREATE POLICY "Users can view capital accounts"
  ON capital_accounts FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Investors can view their own
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.user_id = auth.uid()
      AND investors.id = capital_accounts.investor_id
    )
  );

-- Investor NAV history: Consolidate admin + investor policies
DROP POLICY IF EXISTS "Admins can view all investor NAV history" ON investor_nav_history;
DROP POLICY IF EXISTS "Investors can view own NAV history" ON investor_nav_history;

CREATE POLICY "Users can view investor NAV history"
  ON investor_nav_history FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Investors can view their own
    EXISTS (
      SELECT 1 FROM investors
      JOIN capital_accounts ON capital_accounts.investor_id = investors.id
      WHERE investors.user_id = auth.uid()
      AND capital_accounts.id = investor_nav_history.capital_account_id
    )
  );

-- Investors: Consolidate admin + self-read policies
DROP POLICY IF EXISTS "Authenticated users can view investors" ON investors;
DROP POLICY IF EXISTS "Investors can read own record" ON investors;

CREATE POLICY "Users can view investors"
  ON investors FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Users can view their own investor record
    (user_id = auth.uid())
  );

-- Portfolio categories: Consolidate admin + public policies
DROP POLICY IF EXISTS "Admins can manage portfolio categories" ON portfolio_categories;
DROP POLICY IF EXISTS "Anyone can view portfolio categories" ON portfolio_categories;

CREATE POLICY "Users can view portfolio categories"
  ON portfolio_categories FOR SELECT
  TO authenticated
  USING (true);

-- Portfolio holdings: Consolidate admin + public policies
DROP POLICY IF EXISTS "Admins can manage portfolio holdings" ON portfolio_holdings;
DROP POLICY IF EXISTS "Anyone can view portfolio holdings" ON portfolio_holdings;

CREATE POLICY "Users can view portfolio holdings"
  ON portfolio_holdings FOR SELECT
  TO authenticated
  USING (true);

-- Positions: Consolidate admin + public policies
DROP POLICY IF EXISTS "Admins can view all positions" ON positions;
DROP POLICY IF EXISTS "Members can view published live positions" ON positions;

CREATE POLICY "Users can view positions"
  ON positions FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Others can only view published live positions
    (visibility = 'live' AND status = 'published')
  );

-- Transactions: Consolidate admin + investor policies
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Investors can view own transactions" ON transactions;

CREATE POLICY "Users can view transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Investors can view their own transactions
    EXISTS (
      SELECT 1 FROM investors
      JOIN capital_accounts ON capital_accounts.investor_id = investors.id
      WHERE investors.user_id = auth.uid()
      AND capital_accounts.id = transactions.capital_account_id
    )
  );