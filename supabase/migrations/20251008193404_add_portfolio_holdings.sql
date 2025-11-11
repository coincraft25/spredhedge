/*
  # Portfolio Holdings Schema

  1. New Tables
    - `portfolio_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name (e.g., "Digital Reserve Layer")
      - `purpose` (text) - Strategic purpose description
      - `language_style` (text) - Institutional description
      - `allocation_percentage` (integer) - Target allocation %
      - `display_order` (integer) - Sort order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `portfolio_holdings`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `symbol` (text) - Asset symbol (e.g., "BTC")
      - `name` (text) - Full name (e.g., "Bitcoin")
      - `description` (text) - Asset description
      - `logo_url` (text) - Optional logo URL
      - `observed_return` (text) - Return display (e.g., "+30-60%")
      - `display_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public read access (anyone can view portfolio)
    - Only authenticated admins can modify
*/

CREATE TABLE IF NOT EXISTS portfolio_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  purpose text NOT NULL,
  language_style text NOT NULL,
  allocation_percentage integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES portfolio_categories(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  logo_url text,
  observed_return text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio categories"
  ON portfolio_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage portfolio categories"
  ON portfolio_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view portfolio holdings"
  ON portfolio_holdings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage portfolio holdings"
  ON portfolio_holdings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert initial categories
INSERT INTO portfolio_categories (name, purpose, language_style, allocation_percentage, display_order) VALUES
('Digital Reserve Layer', 'Core, low-volatility assets for preservation and liquidity', 'Reserve assets underpinning fund stability and yield baseline.', 40, 1),
('Asymmetric Opportunity Layer', 'Tactical exposure to high-conviction ecosystems', 'Strategic positions in emerging digital infrastructure and privacy networks.', 40, 2),
('Structured Yield Layer', 'Fixed-income style yield through sovereign, stablecoin, and liquidity mechanisms', 'Predictable income through sovereign and on-chain yield products.', 20, 3);

-- Insert holdings for Digital Reserve Layer
INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'BTC', 'Bitcoin', 'Digital Monetary Reserve — The foundation of the portfolio. Long-term store-of-value and liquidity layer.', '+30–60%', 1
FROM portfolio_categories WHERE name = 'Digital Reserve Layer';

INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'ETH', 'Ethereum', 'Smart Contract Infrastructure — Programmable value layer and DeFi foundation.', '+30–60%', 2
FROM portfolio_categories WHERE name = 'Digital Reserve Layer';

-- Insert holdings for Asymmetric Opportunity Layer
INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'XMR', 'Monero', 'Privacy Layer Protocol — Exposure to digital privacy and distributed computation ecosystems.', '+205%', 1
FROM portfolio_categories WHERE name = 'Asymmetric Opportunity Layer';

INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'WLD', 'Worldcoin', 'Biometric Identity + AI Verification — Building the infrastructure for human authentication in the AI era.', '+20–40%', 2
FROM portfolio_categories WHERE name = 'Asymmetric Opportunity Layer';

INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'APT', 'Aptos', 'High-Speed Layer 1 — Next-generation blockchain with parallel execution capabilities.', '+20–40%', 3
FROM portfolio_categories WHERE name = 'Asymmetric Opportunity Layer';

INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'ICP', 'Internet Computer', 'Decentralized Compute — Building the internet as a global decentralized computing platform.', '+20–40%', 4
FROM portfolio_categories WHERE name = 'Asymmetric Opportunity Layer';

INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'SUI', 'Sui', 'Scalable DeFi Infrastructure — High-performance blockchain for decentralized finance applications.', '+20–40%', 5
FROM portfolio_categories WHERE name = 'Asymmetric Opportunity Layer';

INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'TON', 'Toncoin', 'Communication & Network Layer — Integrated with Telegram for massive-scale adoption.', '+15–30%', 6
FROM portfolio_categories WHERE name = 'Asymmetric Opportunity Layer';

INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'POL', 'Polygon', 'Ethereum Scaling Ecosystem — Layer 2 scaling solution for Ethereum applications.', '+15–30%', 7
FROM portfolio_categories WHERE name = 'Asymmetric Opportunity Layer';

-- Insert holdings for Structured Yield Layer
INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'CETES', 'Mexican Treasury Bills', 'Sovereign Yield — Short-duration Mexican government securities providing stable returns.', '+5–7%', 1
FROM portfolio_categories WHERE name = 'Structured Yield Layer';

INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'USDT', 'Tether Staking', 'Stablecoin Income — On-chain yield generation through stablecoin protocols.', '+5–7%', 2
FROM portfolio_categories WHERE name = 'Structured Yield Layer';

INSERT INTO portfolio_holdings (category_id, symbol, name, description, observed_return, display_order)
SELECT id, 'T-BILLS', 'US Treasury Bills', 'Short-Duration Treasuries — Ultra-safe sovereign yield for liquidity management.', '+5–7%', 3
FROM portfolio_categories WHERE name = 'Structured Yield Layer';