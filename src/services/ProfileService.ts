import { supabase } from '../lib/supabase';
import { UserProfile, OTPVerification, ProfileChangeRestriction } from '../types/user';

export class ProfileService {
  // Get user profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return null;
    }

    if (!userId) {
      console.error('getUserProfile: userId is required');
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error.message);
      if (error.message.includes('permission')) {
        console.error('Permission denied. This might be due to:');
        console.error('1. Row Level Security (RLS) policies');
        console.error('2. User not authenticated');
        console.error('3. Missing table permissions');
      }
      return null;
    }

    return data;
  }

  // Create user profile
  static async createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profile])
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      throw new Error(error.message);
    }

    return data;
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Check profile change restrictions
  static async getProfileChangeRestrictions(userId: string): Promise<ProfileChangeRestriction> {
    if (!supabase) {
      return {
        canChangeName: true,
        canChangeAge: true,
        nameChangeCount: 0,
        ageChangeCount: 0
      };
    }

    const profile = await this.getUserProfile(userId);
    
    if (!profile) {
      return {
        canChangeName: true,
        canChangeAge: true,
        nameChangeCount: 0,
        ageChangeCount: 0
      };
    }

    const now = new Date();
    const nameChangeDate = profile.last_name_change ? new Date(profile.last_name_change) : null;
    const ageChangeDate = profile.last_age_change ? new Date(profile.last_age_change) : null;

    const canChangeName = !nameChangeDate || 
      (now.getTime() - nameChangeDate.getTime()) >= (120 * 24 * 60 * 60 * 1000);
    
    const canChangeAge = !ageChangeDate || 
      (now.getTime() - ageChangeDate.getTime()) >= (120 * 24 * 60 * 60 * 1000);

    const nameChangeAvailableAt = nameChangeDate && !canChangeName
      ? new Date(nameChangeDate.getTime() + (120 * 24 * 60 * 60 * 1000)).toISOString()
      : undefined;

    const ageChangeAvailableAt = ageChangeDate && !canChangeAge
      ? new Date(ageChangeDate.getTime() + (120 * 24 * 60 * 60 * 1000)).toISOString()
      : undefined;

    return {
      canChangeName,
      canChangeAge,
      nameChangeAvailableAt,
      ageChangeAvailableAt,
      nameChangeCount: profile.name_change_count || 0,
      ageChangeCount: profile.age_change_count || 0
    };
  }

  // Generate OTP for secure operations
  static async generateOTP(userId: string, operationType: 'email_change' | 'password_change', newEmail?: string): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.rpc('generate_otp');
    
    if (error) {
      throw new Error('Failed to generate OTP');
    }

    const otpCode = data;

    const { error: insertError } = await supabase
      .from('otp_verifications')
      .insert([{
        user_id: userId,
        operation_type: operationType,
        otp_code: otpCode,
        new_email: newEmail
      }]);

    if (insertError) {
      throw new Error('Failed to store OTP');
    }

    // In a real app, send OTP via email/SMS
    console.log(`OTP for ${operationType}: ${otpCode}`);
    
    return otpCode;
  }

  // Verify OTP
  static async verifyOTP(userId: string, operationType: 'email_change' | 'password_change', otpCode: string): Promise<OTPVerification | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('operation_type', operationType)
      .eq('otp_code', otpCode)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', data.id);

    if (updateError) {
      throw new Error('Failed to verify OTP');
    }

    return data;
  }

  // Upload profile picture
  static async uploadProfilePicture(userId: string, file: File): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error('Failed to upload profile picture');
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  // Upload additional photos
  static async uploadAdditionalPhoto(userId: string, file: File): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/photos/photo-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('user-photos')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error('Failed to upload photo');
    }

    const { data } = supabase.storage
      .from('user-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  // Get public profiles
  static async getPublicProfiles(limit: number = 20, offset: number = 0): Promise<UserProfile[]> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('profile_visibility', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching public profiles:', error);
      return [];
    }

    return data || [];
  }

  // Search profiles
  static async searchProfiles(query: string, limit: number = 20): Promise<UserProfile[]> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('profile_visibility', 'public')
      .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%,hobbies.cs.{${query}}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching profiles:', error);
      return [];
    }

    return data || [];
  }
}