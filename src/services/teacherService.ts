// src/services/teacherService.ts
import { supabase } from '@/lib/supabase';
import type { Teacher } from '@/types/database.types';

export interface CreateTeacherInput {
  nama: string;
  mapel_id: number;
  jam_maks: number;
  hari_tidak_bisa?: string;
}

export interface UpdateTeacherInput extends Partial<CreateTeacherInput> {}

export const teacherService = {
  /**
   * Get all teachers for current user
   */
  async getAll(userId: string): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from('guru')
      .select(`
        *,
        mapel:mapel_id (
          id,
          nama_mapel
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single teacher by ID
   */
  async getById(id: number, userId: string): Promise<Teacher | null> {
    const { data, error } = await supabase
      .from('guru')
      .select(`
        *,
        mapel:mapel_id (
          id,
          nama_mapel
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new teacher
   */
  async create(userId: string, input: CreateTeacherInput): Promise<Teacher> {
    const { data, error } = await supabase
      .from('guru')
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
   * Update teacher
   */
  async update(id: number, userId: string, input: UpdateTeacherInput): Promise<Teacher> {
    const { data, error } = await supabase
      .from('guru')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete teacher
   */
  async delete(id: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('guru')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Get teacher count
   */
  async count(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('guru')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  },
};