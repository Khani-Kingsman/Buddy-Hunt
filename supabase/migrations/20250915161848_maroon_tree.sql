/*
  # Add Users View for Room Relationships

  1. New Views
    - `users` - Public schema view of auth.users for PostgREST relationships

  2. Security
    - Enable RLS on users view
    - Add policy for authenticated users to read user data
*/

-- Create a view in the public schema that references auth.users
CREATE OR REPLACE VIEW public.users AS
SELECT 
  id,
  email,
  created_at
FROM auth.users;

-- Enable Row Level Security on the view
ALTER VIEW public.users SET (security_invoker = true);

-- Create policy for the users view
CREATE POLICY "Users can read user data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);