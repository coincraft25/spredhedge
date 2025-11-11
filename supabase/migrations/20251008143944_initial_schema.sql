/*
  # SpredHedge - Initial Database Schema

  ## Overview
  Creates the complete database structure for the SpredHedge investor portal.

  ## New Tables
  - profiles: User roles and preferences
  - access_requests: Public access request submissions
  - investors: Approved investor records
  - allocations: Fund allocation by category
  - holdings: Detailed holdings within categories
  - wallets: Transparency wallet addresses
  - nav_history: Historical NAV data points
  - performance_metrics: Calculated performance metrics
  - reports: Monthly PDF reports with metadata

  ## Security
  - RLS enabled on all tables
  - Role-based access control
  - Public insert for access requests
  - Admin-only management capabilities
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'investor')) DEFAULT 'investor',
  timezone text DEFAULT 'Europe/Paris',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  country text,
  indicative_ticket text,
  note text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Create investors table
CREATE TABLE IF NOT EXISTS investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  joined_at timestamptz DEFAULT now(),
  notes text
);

ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

-- Create allocations table
CREATE TABLE IF NOT EXISTS allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  allocation_pct numeric NOT NULL CHECK (allocation_pct >= 0 AND allocation_pct <= 100),
  description text,
  thesis text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- Create holdings table
CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  asset_label text NOT NULL,
  weight_pct numeric CHECK (weight_pct >= 0 AND weight_pct <= 100),
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  chain text NOT NULL,
  address text NOT NULL,
  explorer_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Create nav_history table
CREATE TABLE IF NOT EXISTS nav_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  nav numeric NOT NULL,
  aum_usd numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nav_history ENABLE ROW LEVEL SECURITY;

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL,
  mtd_return numeric,
  ytd_return numeric,
  sixm_return numeric,
  max_drawdown numeric,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  title text NOT NULL,
  summary text,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- profiles: users can read/update own profile; admins can read all
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- access_requests: public insert, admin read only
CREATE POLICY "Anyone can submit access request"
  ON access_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read access requests"
  ON access_requests FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update access requests"
  ON access_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- investors: admins full access, investors read own
CREATE POLICY "Admins can manage investors"
  ON investors FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Investors can read own record"
  ON investors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- allocations: authenticated read, admin write
CREATE POLICY "Authenticated users can read allocations"
  ON allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage allocations"
  ON allocations FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- holdings: authenticated read, admin write
CREATE POLICY "Authenticated users can read holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage holdings"
  ON holdings FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- wallets: authenticated read, admin write
CREATE POLICY "Authenticated users can read wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage wallets"
  ON wallets FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- nav_history: authenticated read, admin write
CREATE POLICY "Authenticated users can read nav history"
  ON nav_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage nav history"
  ON nav_history FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- performance_metrics: authenticated read, admin write
CREATE POLICY "Authenticated users can read performance metrics"
  ON performance_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage performance metrics"
  ON performance_metrics FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- reports: authenticated read, admin write
CREATE POLICY "Authenticated users can read reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage reports"
  ON reports FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Seed Data
INSERT INTO allocations (category, allocation_pct, description, thesis) VALUES
  ('Digital Reserve', 40, 'Core treasury holdings in established digital assets', 'Bitcoin and Ethereum provide liquid, established digital reserve assets with proven track records.'),
  ('Structured Yield Layer', 25, 'High-grade yield generation across DeFi protocols', 'Diversified exposure to battle-tested lending protocols and stablecoin yields.'),
  ('Strategic Ventures', 20, 'Thematic allocations with asymmetric upside', 'Selective positions in emerging L1/L2 infrastructure and DeFi primitives.'),
  ('Liquidity Buffer', 15, 'Stablecoins for operational flexibility', 'USDC and USDT reserves for redemptions and opportunistic deployment.')
ON CONFLICT DO NOTHING;

INSERT INTO wallets (label, chain, address, explorer_url) VALUES
  ('Primary Reserve', 'Ethereum', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'https://etherscan.io/address/0x742d35Cc6634C0532925a3b844Bc454e4438f44e'),
  ('Stablecoin Treasury', 'Ethereum', '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 'https://etherscan.io/address/0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'),
  ('Ethereum Ops', 'Ethereum', '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 'https://etherscan.io/address/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
ON CONFLICT DO NOTHING;

INSERT INTO nav_history (date, nav, aum_usd) VALUES
  ('2024-05-01', 1.000, 10000000),
  ('2024-06-01', 1.024, 10240000),
  ('2024-07-01', 1.051, 10850000),
  ('2024-08-01', 1.089, 11620000),
  ('2024-09-01', 1.118, 12050000),
  ('2024-10-01', 1.142, 12400000)
ON CONFLICT (date) DO NOTHING;

INSERT INTO performance_metrics (period, mtd_return, ytd_return, sixm_return, max_drawdown) VALUES
  ('current', 1.8, 12.4, 14.2, 2.9)
ON CONFLICT DO NOTHING;