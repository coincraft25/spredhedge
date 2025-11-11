/*
  # Fix access_requests field names

  1. Changes
    - Rename `name` column to `full_name` for consistency with admin interface
    
  2. Notes
    - This ensures the database schema matches the admin page expectations
    - Existing data will be preserved
*/

-- Rename name column to full_name if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE access_requests RENAME COLUMN name TO full_name;
  END IF;
END $$;
