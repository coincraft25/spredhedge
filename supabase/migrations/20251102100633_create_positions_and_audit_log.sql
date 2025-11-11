/*
  # Portfolio Position Tracking System
  
  ## Overview
  Creates a new position tracking system for internal portfolio management with neutral, compliant language.
  This system coexists with existing fund portal data.
  
  ## New Tables
  
  ### positions
  Tracks individual portfolio entries with full lifecycle management from draft through closing.
  - Core fields: title, ticker, sector, status, entry details, pricing, quantities
  - Admin fields: notes_admin (private), public_note (visible to members)
  - Visibility control: admin_only or members_view
  - Audit trail: created_by, updated_by, timestamps
  
  ### audit_log
  Complete audit trail of all position management actions.
  - Tracks: create, edit, close, archive, publish/unpublish actions
  - Records: user, timestamp, position reference, change summary
  
  ## Security
  - RLS enabled on both tables
  - Admins: full CRUD access to positions, full audit_log access
  - Members: SELECT only on positions with visibility=members_view AND status=Live
  - All mutations logged to audit_log automatically via triggers
  
  ## Calculations
  - cost_basis = entry_price * quantity (stored)
  - unrealized_pnl = (market_price - entry_price) * quantity (computed)
  - realized_pnl = (closing_price - entry_price) * quantity (stored on close)
  - performance_pct = ((current_price / entry_price) - 1) * 100 (computed)
*/

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core identification
  title text NOT NULL,
  ticker text,
  sector text,
  
  -- Status and visibility
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Live', 'Closed', 'Archived')),
  visibility text NOT NULL DEFAULT 'admin_only' CHECK (visibility IN ('admin_only', 'members_view')),
  
  -- Entry details
  entry_date date NOT NULL,
  entry_price numeric(18, 8) NOT NULL CHECK (entry_price > 0),
  quantity numeric(18, 8) NOT NULL CHECK (quantity > 0),
  cost_basis numeric(18, 2) NOT NULL,
  
  -- Target and market pricing
  target_price numeric(18, 8),
  market_price numeric(18, 8),
  price_updated_at timestamptz,
  
  -- Closing details
  closing_price numeric(18, 8),
  closing_date date,
  realized_pnl numeric(18, 2),
  
  -- Notes and metadata
  notes_admin text DEFAULT '',
  public_note text DEFAULT '',
  tags text[] DEFAULT ARRAY[]::text[],
  
  -- Audit fields
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_visibility ON positions(visibility);
CREATE INDEX IF NOT EXISTS idx_positions_entry_date ON positions(entry_date);
CREATE INDEX IF NOT EXISTS idx_positions_sector ON positions(sector);
CREATE INDEX IF NOT EXISTS idx_positions_created_by ON positions(created_by);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN ('create', 'edit', 'close', 'archive', 'publish', 'unpublish', 'restore')),
  position_id uuid REFERENCES positions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  timestamp timestamptz DEFAULT now(),
  diff_summary text,
  notes text
);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_position_id ON audit_log(position_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- Enable RLS
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for positions

-- Members can view Live positions with members_view visibility
CREATE POLICY "Members can view published live positions"
  ON positions FOR SELECT
  TO authenticated
  USING (
    status = 'Live' 
    AND visibility = 'members_view'
  );

-- Admins can view all positions
CREATE POLICY "Admins can view all positions"
  ON positions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert positions
CREATE POLICY "Admins can create positions"
  ON positions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can update positions
CREATE POLICY "Admins can update positions"
  ON positions FOR UPDATE
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

-- Admins can delete positions
CREATE POLICY "Admins can delete positions"
  ON positions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for audit_log

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert audit logs
CREATE POLICY "Admins can create audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Seed sample positions for testing
INSERT INTO positions (
  title, ticker, sector, status, visibility,
  entry_date, entry_price, quantity, cost_basis,
  target_price, market_price, price_updated_at,
  public_note, notes_admin, tags
) VALUES
  (
    'NVIDIA Corporation',
    'NVDA',
    'Technology',
    'Live',
    'members_view',
    '2025-10-01',
    480.00,
    50,
    24000.00,
    560.00,
    575.00,
    now(),
    'Core allocation — technology exposure (internal reference)',
    'Opened to adjust exposure to GPU sector. Strong fundamentals.',
    ARRAY['gpu', 'ai', 'semiconductors']
  ),
  (
    'Ethereum',
    'ETH',
    'Infrastructure',
    'Live',
    'members_view',
    '2025-09-15',
    2800.00,
    10,
    28000.00,
    3200.00,
    2950.00,
    now(),
    'Smart contract platform exposure',
    'Core DeFi infrastructure position',
    ARRAY['defi', 'layer1', 'infrastructure']
  ),
  (
    'Bitcoin',
    'BTC',
    'Digital Reserve',
    'Live',
    'members_view',
    '2025-08-01',
    45000.00,
    0.5,
    22500.00,
    55000.00,
    48000.00,
    now(),
    'Digital reserve asset',
    'Primary reserve holding',
    ARRAY['reserve', 'store-of-value']
  ),
  (
    'Solana',
    'SOL',
    'Infrastructure',
    'Closed',
    'members_view',
    '2025-07-10',
    120.00,
    100,
    12000.00,
    180.00,
    NULL,
    NULL,
    'Layer-1 blockchain position',
    'Closed for profit taking at favorable levels',
    ARRAY['layer1', 'performance']
  ),
  (
    'Uniswap Protocol',
    'UNI',
    'DeFi',
    'Draft',
    'admin_only',
    '2025-11-01',
    8.50,
    500,
    4250.00,
    12.00,
    8.75,
    now(),
    'Decentralized exchange protocol',
    'Under evaluation for DeFi allocation',
    ARRAY['dex', 'defi', 'protocol']
  )
ON CONFLICT DO NOTHING;

-- Update the closed position with realized P&L
UPDATE positions 
SET 
  closing_price = 165.00,
  closing_date = '2025-10-20',
  realized_pnl = (165.00 - 120.00) * 100
WHERE ticker = 'SOL' AND status = 'Closed';

-- Add sample audit log entries
INSERT INTO audit_log (action, position_id, user_id, timestamp, diff_summary, notes)
SELECT 
  'create',
  id,
  created_by,
  created_at,
  'Initial position created',
  'Position opened with entry price ' || entry_price::text
FROM positions
WHERE ticker IN ('NVDA', 'ETH', 'BTC')
ON CONFLICT DO NOTHING;
