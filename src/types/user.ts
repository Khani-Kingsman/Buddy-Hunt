export interface User {
  id: string;
  email: string;
  username?: string;
  display_name: string;
  avatar_url?: string;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  age?: number;
  bio: string;
  hobbies: string[];
  ethnicity?: string;
  religion?: string;
  country?: string;
  languages: string[];
  profile_picture_url?: string;
  additional_photos: string[];
  profile_visibility: 'public' | 'private';
  email_visibility: 'public' | 'private';
  photo_privacy: {
    profile_picture: 'public' | 'private';
    additional_photos: 'public' | 'private';
  };
  last_name_change?: string;
  last_age_change?: string;
  name_change_count?: number;
  age_change_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  type: 'cinema' | 'mansion' | 'private';
  host_id: string;
  host?: {
    id: string;
    email: string;
  };
  is_public: boolean;
  is_active: boolean;
  max_participants: number;
  current_participants?: number;
  host_settings?: {
    allow_screen_share: boolean;
    require_approval: boolean;
    mute_new_participants: boolean;
    allow_chat: boolean;
    allow_reactions: boolean;
    content_moderation: string;
  };
  tags?: string[];
  thumbnail_url?: string;
  region?: string;
  created_at: string;
  updated_at: string;
}

export interface OTPVerification {
  id: string;
  user_id: string;
  operation_type: 'email_change' | 'password_change';
  otp_code: string;
  new_email?: string;
  expires_at: string;
  verified_at?: string;
  created_at: string;
}

export interface ProfileChangeRestriction {
  canChangeName: boolean;
  canChangeAge: boolean;
  nameChangeAvailableAt?: string;
  ageChangeAvailableAt?: string;
  nameChangeCount?: number;
  ageChangeCount?: number;
}