/*
  # Fix access_requests status default value

  1. Changes
    - Change status column default from 'new' to 'pending'
    
  2. Notes
    - This ensures new requests are created with 'pending' status
    - Matches the application's expectation
*/

-- Change the default value for status column
ALTER TABLE access_requests ALTER COLUMN status SET DEFAULT 'pending';
