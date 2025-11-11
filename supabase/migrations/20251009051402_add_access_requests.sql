/*
  # Create access requests table
  
  1. New Tables
    - `access_requests`
      - `id` (uuid, primary key) - Unique identifier for each request
      - `name` (text) - Full name of the requester
      - `email` (text) - Email address of the requester
      - `investment_interest` (text) - Type of investment interest (Fixed/Hybrid/Institutional)
      - `country` (text) - Country of residence
      - `created_at` (timestamptz) - Timestamp of when the request was submitted
      - `status` (text) - Request status (pending/approved/rejected), defaults to 'pending'
      
  2. Security
    - Enable RLS on `access_requests` table
    - Add policy for anyone to insert their own access request (public form submission)
    - Add policy for authenticated admin users to view all requests
    
  3. Notes
    - Public can only INSERT (submit requests)
    - Only authenticated users can SELECT (view requests in admin panel)
    - Email field has validation constraint
*/

CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  investment_interest text NOT NULL CHECK (investment_interest IN ('Fixed', 'Hybrid', 'Institutional')),
  country text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit access requests"
  ON access_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all access requests"
  ON access_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update access requests"
  ON access_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);