// src/services/classService.ts
import { supabase } from '@/lib/supabase';
import type { ClassGroup } from '@/types/database.types';

export interface CreateClassInput {
  nama_kelas: string;
  tingkat?: number;
  jurusan?: string;
}

export interface UpdateClassInput extends Partial<CreateClassInput> {}

export const classService = {
  /**
   * Get all classes for current user
   */
  async getAll(userId: string): Promise<ClassGroup[]> {
    const { data, error } = await supabase
      .from('kelas')
      .select('*')
      .eq('user_id', userId)
      .order('tingkat', { ascending: true })
      .order('nama_kelas', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single class by ID
   */
  async getById(id: number, userId: string): Promise<ClassGroup | null> {
    const { data, error } = await supabase
      .from('kelas')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new class
   */
  async create(userId: string, input: CreateClassInput): Promise<ClassGroup> {
    const { data, error } = await supabase
      .from('kelas')
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
   * Update class
   */
  async update(id: number, userId: string, input: UpdateClassInput): Promise<ClassGroup> {
    const { data, error } = await supabase
      .from('kelas')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete class
   */
  async delete(id: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('kelas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Get class count
   */
  async count(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('kelas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  },
};