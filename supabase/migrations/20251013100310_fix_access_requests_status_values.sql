/*
  # Fix access_requests status values

  1. Changes
    - Drop old status check constraint that uses 'new'
    - Add new status check constraint that uses 'pending'
    - Update existing 'new' status records to 'pending'
    
  2. Notes
    - This ensures consistency between database and application
    - 'pending' is clearer than 'new' for access requests
*/

-- Drop the old constraint
ALTER TABLE access_requests DROP CONSTRAINT IF EXISTS access_requests_status_check;

-- Update any existing 'new' status to 'pending'
UPDATE access_requests SET status = 'pending' WHERE status = 'new';

-- Add the new constraint with correct values
ALTER TABLE access_requests ADD CONSTRAINT access_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));
