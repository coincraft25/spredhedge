/*
  # Add Missing Foreign Key Indexes

  ## Overview
  Adds indexes on all foreign key columns that are currently unindexed.
  This improves query performance when joining tables and enforcing referential integrity.

  ## Changes
  
  ### New Indexes
  - `idx_access_requests_account_created_by` - Index on account_created_by foreign key
  - `idx_access_requests_user_id` - Index on user_id foreign key
  - `idx_homepage_metrics_updated_by` - Index on updated_by foreign key
  - `idx_investors_access_request_id` - Index on access_request_id foreign key
  - `idx_investors_user_id` - Index on user_id foreign key
  - `idx_nav_data_points_updated_by` - Index on updated_by foreign key
  - `idx_portfolio_holdings_category_id` - Index on category_id foreign key
  - `idx_positions_updated_by` - Index on updated_by foreign key
  - `idx_transactions_created_by` - Index on created_by foreign key

  ## Performance Impact
  These indexes significantly improve:
  - Join performance across related tables
  - Foreign key constraint checking speed
  - Query optimization for filtered queries on these columns
*/

-- Add index on access_requests.account_created_by
CREATE INDEX IF NOT EXISTS idx_access_requests_account_created_by 
ON access_requests(account_created_by);

-- Add index on access_requests.user_id
CREATE INDEX IF NOT EXISTS idx_access_requests_user_id 
ON access_requests(user_id);

-- Add index on homepage_metrics.updated_by
CREATE INDEX IF NOT EXISTS idx_homepage_metrics_updated_by 
ON homepage_metrics(updated_by);

-- Add index on investors.access_request_id
CREATE INDEX IF NOT EXISTS idx_investors_access_request_id 
ON investors(access_request_id);

-- Add index on investors.user_id
CREATE INDEX IF NOT EXISTS idx_investors_user_id 
ON investors(user_id);

-- Add index on nav_data_points.updated_by
CREATE INDEX IF NOT EXISTS idx_nav_data_points_updated_by 
ON nav_data_points(updated_by);

-- Add index on portfolio_holdings.category_id
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_category_id 
ON portfolio_holdings(category_id);

-- Add index on positions.updated_by
CREATE INDEX IF NOT EXISTS idx_positions_updated_by 
ON positions(updated_by);

-- Add index on transactions.created_by
CREATE INDEX IF NOT EXISTS idx_transactions_created_by 
ON transactions(created_by);