/*
  # Fix RLS Infinite Recursion

  1. Problem
    - Current RLS policies query the `profiles` table to check if user is admin
    - This creates infinite recursion when accessing profiles table
    - Error: "infinite recursion detected in policy for relation profiles"

  2. Solution
    - Drop all existing policies that check profiles table
    - Recreate policies using simpler logic:
      - For profiles table: Allow users to read/update their own profile only
      - For admin-only tables: Use a helper function that safely checks role
    
  3. Changes
    - Drop and recreate all RLS policies
    - Create a security definer function to check admin role
    - This function can safely query profiles without triggering RLS
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

DROP POLICY IF EXISTS "Admins can manage allocations" ON allocations;
DROP POLICY IF EXISTS "Authenticated users can view allocations" ON allocations;

DROP POLICY IF EXISTS "Admins can manage investors" ON investors;
DROP POLICY IF EXISTS "Authenticated users can view investors" ON investors;

DROP POLICY IF EXISTS "Admins can manage reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can view reports" ON reports;

DROP POLICY IF EXISTS "Admins can manage wallets" ON wallets;
DROP POLICY IF EXISTS "Authenticated users can view wallets" ON wallets;

DROP POLICY IF EXISTS "Admins can manage performance metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Authenticated users can view performance metrics" ON performance_metrics;

DROP POLICY IF EXISTS "Admins can manage holdings" ON holdings;
DROP POLICY IF EXISTS "Authenticated users can view holdings" ON holdings;

DROP POLICY IF EXISTS "Admins can manage nav history" ON nav_history;
DROP POLICY IF EXISTS "Authenticated users can view nav history" ON nav_history;

DROP POLICY IF EXISTS "Admins can read access requests" ON access_requests;
DROP POLICY IF EXISTS "Admins can update access requests" ON access_requests;
DROP POLICY IF EXISTS "Anyone can create access requests" ON access_requests;

DROP POLICY IF EXISTS "Anyone can view homepage metrics" ON homepage_metrics;
DROP POLICY IF EXISTS "Admins can insert homepage metrics" ON homepage_metrics;
DROP POLICY IF EXISTS "Admins can update homepage metrics" ON homepage_metrics;
DROP POLICY IF EXISTS "Admins can delete homepage metrics" ON homepage_metrics;

DROP POLICY IF EXISTS "Anyone can view NAV data points" ON nav_data_points;
DROP POLICY IF EXISTS "Admins can insert NAV data points" ON nav_data_points;
DROP POLICY IF EXISTS "Admins can update NAV data points" ON nav_data_points;
DROP POLICY IF EXISTS "Admins can delete NAV data points" ON nav_data_points;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Profiles policies (no recursion)
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Allocations policies
CREATE POLICY "Authenticated users can view allocations"
  ON allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert allocations"
  ON allocations FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update allocations"
  ON allocations FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete allocations"
  ON allocations FOR DELETE
  TO authenticated
  USING (is_admin());

-- Investors policies
CREATE POLICY "Authenticated users can view investors"
  ON investors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert investors"
  ON investors FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update investors"
  ON investors FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete investors"
  ON investors FOR DELETE
  TO authenticated
  USING (is_admin());

-- Reports policies
CREATE POLICY "Authenticated users can view reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete reports"
  ON reports FOR DELETE
  TO authenticated
  USING (is_admin());

-- Wallets policies
CREATE POLICY "Authenticated users can view wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete wallets"
  ON wallets FOR DELETE
  TO authenticated
  USING (is_admin());

-- Performance metrics policies
CREATE POLICY "Authenticated users can view performance metrics"
  ON performance_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert performance metrics"
  ON performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update performance metrics"
  ON performance_metrics FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete performance metrics"
  ON performance_metrics FOR DELETE
  TO authenticated
  USING (is_admin());

-- Holdings policies
CREATE POLICY "Authenticated users can view holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert holdings"
  ON holdings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update holdings"
  ON holdings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete holdings"
  ON holdings FOR DELETE
  TO authenticated
  USING (is_admin());

-- NAV history policies
CREATE POLICY "Authenticated users can view nav history"
  ON nav_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert nav history"
  ON nav_history FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update nav history"
  ON nav_history FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete nav history"
  ON nav_history FOR DELETE
  TO authenticated
  USING (is_admin());

-- Access requests policies
CREATE POLICY "Anyone can create access requests"
  ON access_requests FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view access requests"
  ON access_requests FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update access requests"
  ON access_requests FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete access requests"
  ON access_requests FOR DELETE
  TO authenticated
  USING (is_admin());

-- Homepage metrics policies
CREATE POLICY "Anyone can view homepage metrics"
  ON homepage_metrics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert homepage metrics"
  ON homepage_metrics FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update homepage metrics"
  ON homepage_metrics FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete homepage metrics"
  ON homepage_metrics FOR DELETE
  TO authenticated
  USING (is_admin());

-- NAV data points policies
CREATE POLICY "Anyone can view NAV data points"
  ON nav_data_points FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert NAV data points"
  ON nav_data_points FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update NAV data points"
  ON nav_data_points FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete NAV data points"
  ON nav_data_points FOR DELETE
  TO authenticated
  USING (is_admin());