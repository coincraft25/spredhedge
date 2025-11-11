/*
  # Add Second Admin User

  1. Creates new admin user account
    - Email: popescupaul44@gmail.com
    - Role: admin
  
  2. Security
    - User will be created with hashed password
    - Profile with admin role will be created
*/

-- Create the user in auth.users (using Supabase's internal function)
-- Note: This uses the admin API to create a user with a password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'popescupaul44@gmail.com',
  crypt('bitcoin25', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Paul Popescu"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Create profile for the new admin user
INSERT INTO profiles (id, full_name, role)
SELECT id, 'Paul Popescu', 'admin'
FROM auth.users
WHERE email = 'popescupaul44@gmail.com';
