/*
  # Add Homepage Metrics and NAV Data Tables

  1. New Tables
    - `homepage_metrics`
      - `id` (uuid, primary key)
      - `metric_key` (text, unique) - e.g., 'aum', 'six_month_return', 'max_drawdown', 'sharpe_ratio'
      - `metric_value` (text) - the display value (e.g., '$12.4M', '+24.3%', '-2.9%', '1.42')
      - `updated_at` (timestamptz) - when the metric was last updated
      - `updated_by` (uuid) - foreign key to auth.users
    
    - `nav_data_points`
      - `id` (uuid, primary key)
      - `month` (text) - e.g., 'May', 'Jun', etc.
      - `value` (numeric) - the NAV value (e.g., 100, 124.3)
      - `display_order` (integer) - for ordering the chart points
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid) - foreign key to auth.users
  
  2. Security
    - Enable RLS on both tables
    - Public read access (for homepage display)
    - Admin-only write access (for updates)
  
  3. Initial Data
    - Seed current metrics
    - Seed current NAV chart data
*/

-- Create homepage_metrics table
CREATE TABLE IF NOT EXISTS homepage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text UNIQUE NOT NULL,
  metric_value text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create nav_data_points table
CREATE TABLE IF NOT EXISTS nav_data_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  value numeric NOT NULL,
  display_order integer NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE homepage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_data_points ENABLE ROW LEVEL SECURITY;

-- Public read access for homepage display
CREATE POLICY "Anyone can read homepage metrics"
  ON homepage_metrics
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read NAV data points"
  ON nav_data_points
  FOR SELECT
  USING (true);

-- Admin-only write access (assuming admin role)
CREATE POLICY "Admins can insert homepage metrics"
  ON homepage_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update homepage metrics"
  ON homepage_metrics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete homepage metrics"
  ON homepage_metrics
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert NAV data points"
  ON nav_data_points
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update NAV data points"
  ON nav_data_points
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete NAV data points"
  ON nav_data_points
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seed current homepage metrics
INSERT INTO homepage_metrics (metric_key, metric_value) VALUES
  ('aum', '$12.4M'),
  ('six_month_return', '+24.3%'),
  ('max_drawdown', '-2.9%'),
  ('sharpe_ratio', '1.42')
ON CONFLICT (metric_key) DO NOTHING;

-- Seed current NAV data
INSERT INTO nav_data_points (month, value, display_order) VALUES
  ('May', 100, 1),
  ('Jun', 104.2, 2),
  ('Jul', 109.8, 3),
  ('Aug', 112.5, 4),
  ('Sep', 118.3, 5),
  ('Oct', 124.3, 6)
ON CONFLICT (display_order) DO NOTHING;