import { supabase } from '../lib/supabase';
import { Room } from '../types/user';

export class RoomService {
  // Get public rooms
  static async getPublicRooms(limit: number = 20, offset: number = 0): Promise<Room[]> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    const { data, error } = await supabase
      .from('enhanced_rooms')
      .select(`
        *,
        host:users (
          id,
          email
        )
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching public rooms:', error.message);
      if (error.message.includes('permission')) {
        console.error('Permission denied accessing rooms. Please check:');
        console.error('1. RLS policies on enhanced_rooms table');
        console.error('2. User authentication status');
        console.error('3. Table exists and has proper structure');
      }
      return [];
    }

    return data || [];
  }

  // Get user's rooms (as host)
  static async getUserRooms(userId: string): Promise<Room[]> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    const { data, error } = await supabase
      .from('enhanced_rooms')
      .select('*')
      .eq('host_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user rooms:', error);
      return [];
    }

    return data || [];
  }

  // Create room
  static async createRoom(roomData: Partial<Room>): Promise<Room | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('enhanced_rooms')
      .insert([roomData])
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      throw new Error(error.message);
    }

    return data;
  }

  // Update room (host only)
  static async updateRoom(roomId: string, updates: Partial<Room>): Promise<Room | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('enhanced_rooms')
      .update(updates)
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error('Error updating room:', error);
      throw new Error(error.message);
    }

    return data;
  }

  // Delete room (host only)
  static async deleteRoom(roomId: string): Promise<boolean> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    const { error } = await supabase
      .from('enhanced_rooms')
      .update({ is_active: false })
      .eq('id', roomId);

    if (error) {
      console.error('Error deleting room:', error);
      return false;
    }

    return true;
  }

  // Join room
  static async joinRoom(roomId: string, userId: string): Promise<boolean> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    const { error } = await supabase
      .from('enhanced_room_participants')
      .insert([{
        room_id: roomId,
        user_id: userId,
        role: 'participant'
      }]);

    if (error) {
      console.error('Error joining room:', error);
      return false;
    }

    return true;
  }

  // Leave room
  static async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    const { error } = await supabase
      .from('enhanced_room_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .is('left_at', null);

    if (error) {
      console.error('Error leaving room:', error);
      return false;
    }

    return true;
  }

  // Get room participants
  static async getRoomParticipants(roomId: string) {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    const { data, error } = await supabase
      .from('enhanced_room_participants')
      .select(`
        *,
        user:user_id (
          id,
          email
        ),
        profile:user_id (
          display_name,
          profile_picture_url
        )
      `)
      .eq('room_id', roomId)
      .is('left_at', null);

    if (error) {
      console.error('Error fetching room participants:', error);
      return [];
    }

    return data || [];
  }

  // Manage room permissions (host/moderator only)
  static async setRoomPermission(
    roomId: string, 
    userId: string, 
    permissionType: 'banned' | 'muted' | 'moderator' | 'vip',
    grantedBy: string,
    reason?: string
  ): Promise<boolean> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    const { error } = await supabase
      .from('room_permissions')
      .upsert([{
        room_id: roomId,
        user_id: userId,
        permission_type: permissionType,
        granted_by: grantedBy,
        reason
      }]);

    if (error) {
      console.error('Error setting room permission:', error);
      return false;
    }

    return true;
  }

  // Remove room permission
  static async removeRoomPermission(roomId: string, userId: string, permissionType: string): Promise<boolean> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    const { error } = await supabase
      .from('room_permissions')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .eq('permission_type', permissionType);

    if (error) {
      console.error('Error removing room permission:', error);
      return false;
    }

    return true;
  }

  // Search rooms
  static async searchRooms(query: string, type?: string): Promise<Room[]> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    let queryBuilder = supabase
      .from('enhanced_rooms')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    const { data, error } = await queryBuilder
      .order('current_participants', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching rooms:', error);
      return [];
    }

    return data || [];
  }
}