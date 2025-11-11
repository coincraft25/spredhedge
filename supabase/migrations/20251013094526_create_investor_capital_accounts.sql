/*
  # Create Investor Capital Accounts and Transactions

  1. New Tables
    - `capital_accounts`
      - Links investors to their investment accounts
      - Tracks current balance, NAV, and status
      - Fields: id, investor_id, initial_investment, current_balance, current_nav, inception_date, status, created_at, updated_at
    
    - `transactions`
      - Records all deposits and withdrawals
      - Fields: id, capital_account_id, type, amount, transaction_date, status, notes, created_by, created_at, updated_at
    
    - `investor_nav_history`
      - Historical NAV tracking for each investor
      - Fields: id, capital_account_id, date, nav_value, shares, nav_per_share, created_at

  2. Security
    - Enable RLS on all tables
    - Admins can manage all records
    - Investors can only view their own data

  3. Important Notes
    - Capital accounts link to existing investors table
    - Transactions support both deposits and withdrawals
    - NAV history allows tracking individual investor performance over time
*/

-- Create capital_accounts table
CREATE TABLE IF NOT EXISTS capital_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  initial_investment numeric(15,2) NOT NULL DEFAULT 0,
  current_balance numeric(15,2) NOT NULL DEFAULT 0,
  current_nav numeric(15,2) NOT NULL DEFAULT 0,
  shares numeric(15,6) NOT NULL DEFAULT 0,
  inception_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capital_account_id uuid NOT NULL REFERENCES capital_accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'distribution', 'fee')),
  amount numeric(15,2) NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create investor_nav_history table
CREATE TABLE IF NOT EXISTS investor_nav_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capital_account_id uuid NOT NULL REFERENCES capital_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  nav_value numeric(15,2) NOT NULL,
  shares numeric(15,6) NOT NULL,
  nav_per_share numeric(10,4) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(capital_account_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_capital_accounts_investor ON capital_accounts(investor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(capital_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_investor_nav_history_account ON investor_nav_history(capital_account_id);
CREATE INDEX IF NOT EXISTS idx_investor_nav_history_date ON investor_nav_history(date);

-- Enable RLS
ALTER TABLE capital_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_nav_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for capital_accounts
CREATE POLICY "Admins can view all capital accounts"
  ON capital_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Investors can view own capital account"
  ON capital_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors
      WHERE investors.id = capital_accounts.investor_id
      AND investors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert capital accounts"
  ON capital_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update capital accounts"
  ON capital_accounts FOR UPDATE
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

CREATE POLICY "Admins can delete capital accounts"
  ON capital_accounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Investors can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM capital_accounts
      JOIN investors ON investors.id = capital_accounts.investor_id
      WHERE capital_accounts.id = transactions.capital_account_id
      AND investors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update transactions"
  ON transactions FOR UPDATE
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

CREATE POLICY "Admins can delete transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for investor_nav_history
CREATE POLICY "Admins can view all investor NAV history"
  ON investor_nav_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Investors can view own NAV history"
  ON investor_nav_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM capital_accounts
      JOIN investors ON investors.id = capital_accounts.investor_id
      WHERE capital_accounts.id = investor_nav_history.capital_account_id
      AND investors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert investor NAV history"
  ON investor_nav_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update investor NAV history"
  ON investor_nav_history FOR UPDATE
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

CREATE POLICY "Admins can delete investor NAV history"
  ON investor_nav_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
