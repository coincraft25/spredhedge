/*
  # Add Account Creation Tracking

  ## Overview
  Adds fields to track when investor accounts are created and by whom.

  ## Changes
  1. Add columns to access_requests table:
     - `user_id` (uuid, nullable, references auth.users) - Links to created user account
     - `account_created_at` (timestamptz, nullable) - When the account was created
     - `account_created_by` (uuid, nullable, references auth.users) - Admin who created the account
  
  2. Add columns to investors table:
     - `access_request_id` (uuid, nullable, references access_requests) - Links back to original request

  ## Security
  - No changes to RLS policies
  - Foreign key constraints ensure data integrity
*/

-- Add account tracking columns to access_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE access_requests ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'account_created_at'
  ) THEN
    ALTER TABLE access_requests ADD COLUMN account_created_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'account_created_by'
  ) THEN
    ALTER TABLE access_requests ADD COLUMN account_created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add access request link to investors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'investors' AND column_name = 'access_request_id'
  ) THEN
    ALTER TABLE investors ADD COLUMN access_request_id uuid REFERENCES access_requests(id) ON DELETE SET NULL;
  END IF;
END $$;