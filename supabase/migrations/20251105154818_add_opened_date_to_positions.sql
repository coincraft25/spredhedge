/*
  # Add Opened Date to Positions

  ## Overview
  Adds a new `opened_date` field to track when positions were first opened (transitioned to Live status).
  This provides clear tracking separate from entry_date and created_at timestamps.

  ## Changes
  
  ### Schema Changes
  - Add `opened_date` column to positions table (nullable date field)
  - Add index on `opened_date` for efficient sorting and filtering
  
  ### Data Migration
  - Backfill existing Live and Closed positions with their entry_date as opened_date
  - Leave Draft and Archived positions with null opened_date (will be set when they go Live)
  
  ## Notes
  - The opened_date is intentionally nullable to distinguish between positions that haven't been opened yet (Drafts)
  - Once set, this field should remain immutable for historical accuracy
  - The field will be automatically populated when a position's status changes to 'Live'
*/

-- Add opened_date column to positions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'opened_date'
  ) THEN
    ALTER TABLE positions ADD COLUMN opened_date date;
  END IF;
END $$;

-- Backfill existing Live and Closed positions with their entry_date
-- This assumes that positions that are currently Live or Closed were opened on their entry date
UPDATE positions
SET opened_date = entry_date
WHERE opened_date IS NULL 
  AND status IN ('Live', 'Closed');

-- Create index for efficient queries on opened_date
CREATE INDEX IF NOT EXISTS idx_positions_opened_date ON positions(opened_date);

-- Add helpful comment to the column
COMMENT ON COLUMN positions.opened_date IS 'Date when the position was first opened (transitioned to Live status). Null for positions that have never been Live.';