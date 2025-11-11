/*
  # Update access_requests table with enhanced fields
  
  1. Changes
    - Add `investor_type` field (dropdown: Individual/Family Office/Fund/Company/Other)
    - Add `investment_amount` field (dropdown: 5000-10000/10000-25000/25000-50000/50000+)
    - Add `is_accredited` field (boolean checkbox confirmation)
    - Add `consent_given` field (boolean for legal consent)
    - Add `message` field (optional text area for notes)
    - Add `ip_address` field (optional for tracking)
    - Remove old `investment_interest` field
    
  2. Security
    - RLS policies remain the same
    - Public can INSERT (submit requests)
    - Authenticated admins can SELECT and UPDATE
    
  3. Notes
    - All new fields are properly validated
    - Boolean fields default to false for safety
    - Investment amount ranges are stored as text for flexibility
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'investor_type'
  ) THEN
    ALTER TABLE access_requests 
    ADD COLUMN investor_type text CHECK (investor_type IN ('Individual', 'Family Office', 'Fund', 'Company', 'Other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'investment_amount'
  ) THEN
    ALTER TABLE access_requests 
    ADD COLUMN investment_amount text CHECK (investment_amount IN ('5000-10000', '10000-25000', '25000-50000', '50000+'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'is_accredited'
  ) THEN
    ALTER TABLE access_requests 
    ADD COLUMN is_accredited boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'consent_given'
  ) THEN
    ALTER TABLE access_requests 
    ADD COLUMN consent_given boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'message'
  ) THEN
    ALTER TABLE access_requests 
    ADD COLUMN message text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE access_requests 
    ADD COLUMN ip_address text;
  END IF;
END $$;

-- Drop the old investment_interest column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'investment_interest'
  ) THEN
    ALTER TABLE access_requests DROP COLUMN investment_interest;
  END IF;
END $$;