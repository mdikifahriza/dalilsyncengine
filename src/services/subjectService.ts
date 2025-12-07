// src/services/subjectService.ts
import { supabase } from '@/lib/supabase';
import type { Subject } from '@/types/database.types';

export interface CreateSubjectInput {
  nama_mapel: string;
  jumlah_jam_per_minggu: number;
  ruang_khusus?: string;
}

export interface UpdateSubjectInput extends Partial<CreateSubjectInput> {}

export const subjectService = {
  /**
   * Get all subjects for current user
   */
  async getAll(userId: string): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('mapel')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single subject by ID
   */
  async getById(id: number, userId: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('mapel')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new subject
   */
  async create(userId: string, input: CreateSubjectInput): Promise<Subject> {
    const { data, error } = await supabase
      .from('mapel')
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
   * Update subject
   */
  async update(id: number, userId: string, input: UpdateSubjectInput): Promise<Subject> {
    const { data, error } = await supabase
      .from('mapel')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete subject
   */
  async delete(id: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('mapel')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Get subject count
   */
  async count(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('mapel')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  },
};