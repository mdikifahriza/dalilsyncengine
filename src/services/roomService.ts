// src/services/roomService.ts
import { supabase } from '@/lib/supabase';
import type { Room } from '@/types/database.types';

export interface CreateRoomInput {
  nama_ruang: string;
  kapasitas: number;
  tipe_ruang: string;
}

export interface UpdateRoomInput extends Partial<CreateRoomInput> {}

export const roomService = {
  /**
   * Get all rooms for current user
   */
  async getAll(userId: string): Promise<Room[]> {
    const { data, error } = await supabase
      .from('ruang')
      .select('*')
      .eq('user_id', userId)
      .order('tipe_ruang', { ascending: true })
      .order('nama_ruang', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single room by ID
   */
  async getById(id: number, userId: string): Promise<Room | null> {
    const { data, error } = await supabase
      .from('ruang')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new room
   */
  async create(userId: string, input: CreateRoomInput): Promise<Room> {
    const { data, error } = await supabase
      .from('ruang')
      .insert({
        user_id: userId,
        ...input,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update room
   */
  async update(id: number, userId: string, input: UpdateRoomInput): Promise<Room> {
    const { data, error } = await supabase
      .from('ruang')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete room
   */
  async delete(id: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('ruang')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Get room count
   */
  async count(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('ruang')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  },
};