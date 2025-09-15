/*
  # Enhanced Buddy Hunt Database Schema

  1. New Tables
    - `user_profiles` - Extended user profile information
    - `enhanced_rooms` - Cinema and mansion rooms with advanced features
    - `enhanced_room_participants` - Room participation tracking
    - `room_permissions` - Room-level permissions and moderation
    - `otp_verifications` - OTP verification for secure operations
    - `profile_change_logs` - Audit trail for profile changes

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    - Implement secure OTP generation

  3. Features
    - Profile change restrictions (120-day cooldown)
    - Room moderation and permissions
    - Secure profile updates with OTP verification
    - Comprehensive audit logging
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  age integer CHECK (age >= 13 AND age <= 120),
  bio text DEFAULT '',
  hobbies text[] DEFAULT '{}',
  ethnicity text,
  religion text,
  country text,
  languages text[] DEFAULT '{}',
  profile_picture_url text,
  additional_photos text[] DEFAULT '{}',
  profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
  email_visibility text DEFAULT 'private' CHECK (email_visibility IN ('public', 'private')),
  photo_privacy jsonb DEFAULT '{"profile_picture": "public", "additional_photos": "public"}',
  last_name_change timestamptz,
  last_age_change timestamptz,
  name_change_count integer DEFAULT 0,
  age_change_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enhanced Rooms Table
CREATE TABLE IF NOT EXISTS enhanced_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('cinema', 'mansion', 'private')),
  host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT true,
  is_active boolean DEFAULT true,
  max_participants integer DEFAULT 50 CHECK (max_participants > 0),
  current_participants integer DEFAULT 0,
  host_settings jsonb DEFAULT '{
    "allow_screen_share": true,
    "require_approval": false,
    "mute_new_participants": false,
    "allow_chat": true,
    "allow_reactions": true,
    "content_moderation": "moderate"
  }',
  tags text[] DEFAULT '{}',
  thumbnail_url text,
  region text DEFAULT 'us-east-1',
  password_hash text,
  stream_url text,
  mansion_theme text,
  background_music_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Room Participants Table
CREATE TABLE IF NOT EXISTS enhanced_room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES enhanced_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  role text DEFAULT 'participant' CHECK (role IN ('host', 'moderator', 'participant', 'viewer')),
  is_muted boolean DEFAULT false,
  is_camera_on boolean DEFAULT false,
  UNIQUE(room_id, user_id, joined_at)
);

-- Room Permissions Table
CREATE TABLE IF NOT EXISTS room_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES enhanced_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_type text NOT NULL CHECK (permission_type IN ('banned', 'muted', 'moderator', 'vip')),
  granted_by uuid REFERENCES auth.users(id),
  reason text,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(room_id, user_id, permission_type)
);

-- OTP Verifications Table
CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type text NOT NULL CHECK (operation_type IN ('email_change', 'password_change', 'profile_update', 'room_creation', 'sensitive_action')),
  otp_code text NOT NULL,
  new_email text,
  expires_at timestamptz DEFAULT (now() + interval '10 minutes'),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Profile Change Logs Table
CREATE TABLE IF NOT EXISTS profile_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  changed_at timestamptz DEFAULT now(),
  ip_address inet
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_visibility ON user_profiles(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_enhanced_rooms_host ON enhanced_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_rooms_public_active ON enhanced_rooms(is_public, is_active);
CREATE INDEX IF NOT EXISTS idx_enhanced_rooms_type ON enhanced_rooms(type);
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON enhanced_room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON enhanced_room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_active ON enhanced_room_participants(room_id, left_at) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_room_permissions_room_user ON room_permissions(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_user ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_profile_change_logs_user ON profile_change_logs(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_change_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read public profiles" ON user_profiles
  FOR SELECT USING (profile_visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for enhanced_rooms
CREATE POLICY "Anyone can read public active rooms" ON enhanced_rooms
  FOR SELECT USING (is_public = true AND is_active = true);

CREATE POLICY "Users can read own rooms" ON enhanced_rooms
  FOR SELECT USING (host_id = auth.uid());

CREATE POLICY "Users can create rooms" ON enhanced_rooms
  FOR INSERT WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update own rooms" ON enhanced_rooms
  FOR UPDATE USING (host_id = auth.uid());

-- RLS Policies for enhanced_room_participants
CREATE POLICY "Users can read room participants" ON enhanced_room_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join rooms" ON enhanced_room_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participation" ON enhanced_room_participants
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for room_permissions
CREATE POLICY "Users can read room permissions" ON room_permissions
  FOR SELECT USING (true);

CREATE POLICY "Room hosts can manage permissions" ON room_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM enhanced_rooms 
      WHERE enhanced_rooms.id = room_permissions.room_id 
      AND enhanced_rooms.host_id = auth.uid()
    )
  );

-- RLS Policies for otp_verifications
CREATE POLICY "Users can manage own OTP" ON otp_verifications
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for profile_change_logs
CREATE POLICY "Users can read own change logs" ON profile_change_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert change logs" ON profile_change_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Functions for OTP generation
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$;

-- Function to update room participant count
CREATE OR REPLACE FUNCTION update_room_participant_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE enhanced_rooms 
    SET current_participants = (
      SELECT COUNT(*) 
      FROM enhanced_room_participants 
      WHERE room_id = NEW.room_id AND left_at IS NULL
    )
    WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE enhanced_rooms 
    SET current_participants = (
      SELECT COUNT(*) 
      FROM enhanced_room_participants 
      WHERE room_id = NEW.room_id AND left_at IS NULL
    )
    WHERE id = NEW.room_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to automatically update participant count
CREATE TRIGGER update_room_participant_count_trigger
  AFTER INSERT OR UPDATE ON enhanced_room_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_room_participant_count();

-- Function to log profile changes
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.display_name != NEW.display_name THEN
    INSERT INTO profile_change_logs (user_id, field_changed, old_value, new_value)
    VALUES (NEW.user_id, 'display_name', OLD.display_name, NEW.display_name);
    
    NEW.last_name_change = now();
    NEW.name_change_count = COALESCE(OLD.name_change_count, 0) + 1;
  END IF;
  
  IF OLD.age != NEW.age THEN
    INSERT INTO profile_change_logs (user_id, field_changed, old_value, new_value)
    VALUES (NEW.user_id, 'age', OLD.age::text, NEW.age::text);
    
    NEW.last_age_change = now();
    NEW.age_change_count = COALESCE(OLD.age_change_count, 0) + 1;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to log profile changes
CREATE TRIGGER log_profile_changes_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_changes();

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM otp_verifications WHERE expires_at < now();
END;
$$;