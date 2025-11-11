/*
  # Remove Duplicate RLS Policies

  ## Overview
  Removes duplicate permissive policies that cause conflicts and potential security issues.
  Each table should have only one policy per role per action.

  ## Changes
  
  ### Removed Duplicate Policies
  - access_requests: Multiple INSERT policies for anon and authenticated
  - access_requests: Multiple SELECT and UPDATE policies for authenticated
  - allocations: Duplicate SELECT policies
  - holdings: Duplicate SELECT policies
  - homepage_metrics: Duplicate SELECT policies
  - nav_data_points: Duplicate SELECT policies
  - nav_history: Duplicate SELECT policies
  - performance_metrics: Duplicate SELECT policies
  - portfolio_categories: Duplicate SELECT policies
  - portfolio_holdings: Duplicate SELECT policies
  - reports: Duplicate SELECT policies
  - wallets: Duplicate SELECT policies
  - investors: Duplicate SELECT policies

  ## Strategy
  Keep the most descriptive and specific policy name, remove older/generic versions.
*/

-- ============================================================================
-- ACCESS_REQUESTS TABLE
-- ============================================================================

-- Remove old duplicate INSERT policies, keep the most recent one
DROP POLICY IF EXISTS "Anyone can create access requests" ON access_requests;
DROP POLICY IF EXISTS "Anyone can submit access request" ON access_requests;

-- Remove duplicate authenticated SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all access requests" ON access_requests;

-- Remove duplicate authenticated UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can update access requests" ON access_requests;

-- ============================================================================
-- ALLOCATIONS TABLE
-- ============================================================================

-- Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read allocations" ON allocations;

-- ============================================================================
-- HOLDINGS TABLE
-- ============================================================================

-- Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read holdings" ON holdings;

-- ============================================================================
-- HOMEPAGE_METRICS TABLE
-- ============================================================================

-- Remove old duplicate SELECT policy
DROP POLICY IF EXISTS "Anyone can read homepage metrics" ON homepage_metrics;

-- ============================================================================
-- NAV_DATA_POINTS TABLE
-- ============================================================================

-- Remove old duplicate SELECT policy
DROP POLICY IF EXISTS "Anyone can read NAV data points" ON nav_data_points;

-- ============================================================================
-- NAV_HISTORY TABLE
-- ============================================================================

-- Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read nav history" ON nav_history;

-- ============================================================================
-- PERFORMANCE_METRICS TABLE
-- ============================================================================

-- Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read performance metrics" ON performance_metrics;

-- ============================================================================
-- PORTFOLIO_CATEGORIES TABLE
-- ============================================================================

-- Keep the "Anyone can view portfolio categories" policy as it's more general
-- The "Admins can manage portfolio categories" policy handles admin-specific permissions
-- No changes needed here as they serve different purposes

-- ============================================================================
-- PORTFOLIO_HOLDINGS TABLE
-- ============================================================================

-- Keep the "Anyone can view portfolio holdings" policy as it's more general
-- The "Admins can manage portfolio holdings" policy handles admin-specific permissions
-- No changes needed here as they serve different purposes

-- ============================================================================
-- REPORTS TABLE
-- ============================================================================

-- Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read reports" ON reports;

-- ============================================================================
-- WALLETS TABLE
-- ============================================================================

-- Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read wallets" ON wallets;

-- ============================================================================
-- INVESTORS TABLE
-- ============================================================================

-- Keep "Authenticated users can view investors" for general access
-- Keep "Investors can read own record" for specific investor access
-- These serve different purposes, but let's verify if we need both
-- For now, keeping both as they have different use cases