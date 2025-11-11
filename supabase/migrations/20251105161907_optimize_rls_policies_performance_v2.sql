/*
  # Optimize RLS Policies Performance

  ## Overview
  Optimizes Row Level Security policies by replacing auth.uid() with (select auth.uid()).
  This prevents re-evaluation of auth functions for each row, significantly improving query performance at scale.

  ## Changes
  
  ### Optimized Policies
  All policies now use (select auth.uid()) instead of auth.uid() to evaluate once per query instead of per row.
  
  ### Tables Affected
  - profiles
  - investors
  - portfolio_categories
  - portfolio_holdings
  - capital_accounts
  - transactions
  - investor_nav_history
  - positions
  - audit_log

  ## Performance Impact
  Significant improvement in query performance, especially on tables with many rows.
  Auth function is evaluated once per query instead of once per row.
*/

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- Drop and recreate profiles policies with optimization
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================================================
-- INVESTORS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Investors can read own record" ON investors;

CREATE POLICY "Investors can read own record"
  ON investors FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- PORTFOLIO_CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage portfolio categories" ON portfolio_categories;

CREATE POLICY "Admins can manage portfolio categories"
  ON portfolio_categories
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- PORTFOLIO_HOLDINGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage portfolio holdings" ON portfolio_holdings;

CREATE POLICY "Admins can manage portfolio holdings"
  ON portfolio_holdings
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- CAPITAL_ACCOUNTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all capital accounts" ON capital_accounts;
DROP POLICY IF EXISTS "Investors can view own capital account" ON capital_accounts;
DROP POLICY IF EXISTS "Admins can insert capital accounts" ON capital_accounts;
DROP POLICY IF EXISTS "Admins can update capital accounts" ON capital_accounts;
DROP POLICY IF EXISTS "Admins can delete capital accounts" ON capital_accounts;

CREATE POLICY "Admins can view all capital accounts"
  ON capital_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Investors can view own capital account"
  ON capital_accounts FOR SELECT
  TO authenticated
  USING (investor_id = (select auth.uid()));

CREATE POLICY "Admins can insert capital accounts"
  ON capital_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update capital accounts"
  ON capital_accounts FOR UPDATE
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

CREATE POLICY "Admins can delete capital accounts"
  ON capital_accounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Investors can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON transactions;

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Investors can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    capital_account_id IN (
      SELECT id FROM capital_accounts 
      WHERE investor_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update transactions"
  ON transactions FOR UPDATE
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

CREATE POLICY "Admins can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- INVESTOR_NAV_HISTORY TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all investor NAV history" ON investor_nav_history;
DROP POLICY IF EXISTS "Investors can view own NAV history" ON investor_nav_history;
DROP POLICY IF EXISTS "Admins can insert investor NAV history" ON investor_nav_history;
DROP POLICY IF EXISTS "Admins can update investor NAV history" ON investor_nav_history;
DROP POLICY IF EXISTS "Admins can delete investor NAV history" ON investor_nav_history;

CREATE POLICY "Admins can view all investor NAV history"
  ON investor_nav_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Investors can view own NAV history"
  ON investor_nav_history FOR SELECT
  TO authenticated
  USING (
    capital_account_id IN (
      SELECT id FROM capital_accounts 
      WHERE investor_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can insert investor NAV history"
  ON investor_nav_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update investor NAV history"
  ON investor_nav_history FOR UPDATE
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

CREATE POLICY "Admins can delete investor NAV history"
  ON investor_nav_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- POSITIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all positions" ON positions;
DROP POLICY IF EXISTS "Admins can create positions" ON positions;
DROP POLICY IF EXISTS "Admins can update positions" ON positions;
DROP POLICY IF EXISTS "Admins can delete positions" ON positions;

CREATE POLICY "Admins can view all positions"
  ON positions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create positions"
  ON positions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update positions"
  ON positions FOR UPDATE
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

CREATE POLICY "Admins can delete positions"
  ON positions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- AUDIT_LOG TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_log;
DROP POLICY IF EXISTS "Admins can create audit logs" ON audit_log;

CREATE POLICY "Admins can view audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );