/*
  # Create Buddy Hunt Database Schema

  1. New Tables
    - `user_profiles` - Extended user profiles with privacy controls
    - `enhanced_rooms` - Cinema and mansion rooms with host controls  
    - `enhanced_room_participants` - Room participation tracking
    - `room_permissions` - Host permission management
    - `otp_verifications` - Secure operations verification
    - `profile_change_logs` - Audit trail for profile changes

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure access controls for room management
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  hobbies text[],
  location text,
  age integer,
  privacy_level text DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private')),
  show_online_status boolean DEFAULT true,
  allow_friend_requests boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create enhanced_rooms table
CREATE TABLE IF NOT EXISTS enhanced_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  room_type text NOT NULL CHECK (room_type IN ('cinema', 'mansion')),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_participants integer DEFAULT 50,
  is_public boolean DEFAULT true,
  is_active boolean DEFAULT true,
  password_hash text,
  stream_url text,
  mansion_theme text,
  background_music_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create enhanced_room_participants table
CREATE TABLE IF NOT EXISTS enhanced_room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES enhanced_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  role text DEFAULT 'participant' CHECK (role IN ('host', 'moderator', 'participant')),
  is_muted boolean DEFAULT false,
  is_camera_on boolean DEFAULT false,
  UNIQUE(room_id, user_id)
);

-- Create room_permissions table
CREATE TABLE IF NOT EXISTS room_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES enhanced_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_type text NOT NULL CHECK (permission_type IN ('kick', 'mute', 'ban', 'moderate')),
  granted_by uuid NOT NULL REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id, permission_type)
);

-- Create otp_verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_code text NOT NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('profile_update', 'room_creation', 'sensitive_action')),
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create profile_change_logs table
CREATE TABLE IF NOT EXISTS profile_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamptz DEFAULT now(),
  ip_address inet
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_change_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- User profiles policies
CREATE POLICY "Users can read public profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (privacy_level = 'public' OR id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Enhanced rooms policies
CREATE POLICY "Anyone can read public active rooms"
  ON enhanced_rooms
  FOR SELECT
  TO authenticated
  USING (is_public = true AND is_active = true);

CREATE POLICY "Users can read own rooms"
  ON enhanced_rooms
  FOR SELECT
  TO authenticated
  USING (host_id = auth.uid());

CREATE POLICY "Users can create rooms"
  ON enhanced_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update own rooms"
  ON enhanced_rooms
  FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid());

-- Room participants policies
CREATE POLICY "Users can read room participants"
  ON enhanced_room_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join rooms"
  ON enhanced_room_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participation"
  ON enhanced_room_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Room permissions policies
CREATE POLICY "Users can read room permissions"
  ON room_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Room hosts can manage permissions"
  ON room_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enhanced_rooms 
      WHERE id = room_id AND host_id = auth.uid()
    )
  );

-- OTP verifications policies
CREATE POLICY "Users can manage own OTP"
  ON otp_verifications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Profile change logs policies
CREATE POLICY "Users can read own change logs"
  ON profile_change_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert change logs"
  ON profile_change_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_privacy ON user_profiles(privacy_level);
CREATE INDEX IF NOT EXISTS idx_enhanced_rooms_public_active ON enhanced_rooms(is_public, is_active);
CREATE INDEX IF NOT EXISTS idx_enhanced_rooms_host ON enhanced_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON enhanced_room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON enhanced_room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_user ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires ON otp_verifications(expires_at);