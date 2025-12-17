// src/services/timeBlockService.ts

import { supabase } from '@/lib/supabase';
import type {
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  Jenjang,
} from '@/types/database.types';

export const timeBlockService = {
  /**
   * Get all time blocks for user
   */
  async getAll(userId: string): Promise<TimeBlock[]> {
    const { data, error } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', userId)
      .order('urutan', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Get lesson blocks only (for GA)
   */
  async getLessonBlocks(userId: string): Promise<TimeBlock[]> {
    const { data, error } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('user_id', userId)
      .eq('tipe_block', 'lesson')
      .eq('is_fixed', false)
      .order('urutan', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Get by ID
   */
  async getById(id: number): Promise<TimeBlock> {
    const { data, error } = await supabase
      .from('time_blocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Create time block
   */
  async create(
    userId: string,
    input: CreateTimeBlockInput
  ): Promise<TimeBlock> {
    const { data, error } = await supabase
      .from('time_blocks')
      .insert({
        user_id: userId,
        ...input,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Bulk create time blocks
   */
  async createBulk(
    userId: string,
    blocks: CreateTimeBlockInput[]
  ): Promise<TimeBlock[]> {
    const { data, error } = await supabase
      .from('time_blocks')
      .insert(blocks.map(b => ({ user_id: userId, ...b })))
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Update time block
   */
  async update(
    id: number,
    userId: string,
    input: UpdateTimeBlockInput
  ): Promise<TimeBlock> {
    const { data, error } = await supabase
      .from('time_blocks')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Delete time block
   */
  async delete(id: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('time_blocks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Delete all time blocks for user
   */
  async deleteAll(userId: string): Promise<void> {
    const { error } = await supabase
      .from('time_blocks')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Generate default template based on jenjang
   */
  generateTemplate(jenjang: Jenjang): CreateTimeBlockInput[] {
    const templates: Record<Jenjang, CreateTimeBlockInput[]> = {
      'TK': [
        { nama_block: 'Jam 1', tipe_block: 'lesson', jam_mulai: '08:00', jam_selesai: '08:30', urutan: 1, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat', tipe_block: 'break', jam_mulai: '08:30', jam_selesai: '08:45', urutan: 2, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 2', tipe_block: 'lesson', jam_mulai: '08:45', jam_selesai: '09:15', urutan: 3, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 3', tipe_block: 'lesson', jam_mulai: '09:15', jam_selesai: '09:45', urutan: 4, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat 2', tipe_block: 'break', jam_mulai: '09:45', jam_selesai: '10:00', urutan: 5, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 4', tipe_block: 'lesson', jam_mulai: '10:00', jam_selesai: '10:30', urutan: 6, warna: '#4F46E5', is_fixed: false },
      ],

      'PAUD': [
        { nama_block: 'Jam 1', tipe_block: 'lesson', jam_mulai: '08:00', jam_selesai: '08:30', urutan: 1, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat', tipe_block: 'break', jam_mulai: '08:30', jam_selesai: '08:45', urutan: 2, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 2', tipe_block: 'lesson', jam_mulai: '08:45', jam_selesai: '09:15', urutan: 3, warna: '#4F46E5', is_fixed: false },
      ],

      'SD': [
        { nama_block: 'Apel Pagi', tipe_block: 'event', jam_mulai: '07:00', jam_selesai: '07:15', urutan: 0, warna: '#F59E0B', is_fixed: true },
        { nama_block: 'Jam 1', tipe_block: 'lesson', jam_mulai: '07:15', jam_selesai: '07:50', urutan: 1, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 2', tipe_block: 'lesson', jam_mulai: '07:50', jam_selesai: '08:25', urutan: 2, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat 1', tipe_block: 'break', jam_mulai: '08:25', jam_selesai: '08:40', urutan: 3, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 3', tipe_block: 'lesson', jam_mulai: '08:40', jam_selesai: '09:15', urutan: 4, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 4', tipe_block: 'lesson', jam_mulai: '09:15', jam_selesai: '09:50', urutan: 5, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat 2', tipe_block: 'break', jam_mulai: '09:50', jam_selesai: '10:05', urutan: 6, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 5', tipe_block: 'lesson', jam_mulai: '10:05', jam_selesai: '10:40', urutan: 7, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 6', tipe_block: 'lesson', jam_mulai: '10:40', jam_selesai: '11:15', urutan: 8, warna: '#4F46E5', is_fixed: false },
      ],

      'MI': [
        { nama_block: 'Sholat Dhuha', tipe_block: 'prayer', jam_mulai: '07:00', jam_selesai: '07:20', urutan: 0, warna: '#8B5CF6', is_fixed: true },
        { nama_block: 'Jam 1', tipe_block: 'lesson', jam_mulai: '07:20', jam_selesai: '07:55', urutan: 1, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 2', tipe_block: 'lesson', jam_mulai: '07:55', jam_selesai: '08:30', urutan: 2, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat 1', tipe_block: 'break', jam_mulai: '08:30', jam_selesai: '08:45', urutan: 3, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 3', tipe_block: 'lesson', jam_mulai: '08:45', jam_selesai: '09:20', urutan: 4, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 4', tipe_block: 'lesson', jam_mulai: '09:20', jam_selesai: '09:55', urutan: 5, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat 2', tipe_block: 'break', jam_mulai: '09:55', jam_selesai: '10:10', urutan: 6, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 5', tipe_block: 'lesson', jam_mulai: '10:10', jam_selesai: '10:45', urutan: 7, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 6', tipe_block: 'lesson', jam_mulai: '10:45', jam_selesai: '11:20', urutan: 8, warna: '#4F46E5', is_fixed: false },
      ],

      'SMP': [
        { nama_block: 'Jam 1', tipe_block: 'lesson', jam_mulai: '07:00', jam_selesai: '07:40', urutan: 1, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 2', tipe_block: 'lesson', jam_mulai: '07:40', jam_selesai: '08:20', urutan: 2, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 3', tipe_block: 'lesson', jam_mulai: '08:20', jam_selesai: '09:00', urutan: 3, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat 1', tipe_block: 'break', jam_mulai: '09:00', jam_selesai: '09:20', urutan: 4, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 4', tipe_block: 'lesson', jam_mulai: '09:20', jam_selesai: '10:00', urutan: 5, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 5', tipe_block: 'lesson', jam_mulai: '10:00', jam_selesai: '10:40', urutan: 6, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Sholat Dzuhur', tipe_block: 'prayer', jam_mulai: '11:30', jam_selesai: '12:00', urutan: 7, warna: '#8B5CF6', is_fixed: true },
        { nama_block: 'Istirahat 2', tipe_block: 'break', jam_mulai: '12:00', jam_selesai: '12:15', urutan: 8, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 6', tipe_block: 'lesson', jam_mulai: '12:15', jam_selesai: '12:55', urutan: 9, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 7', tipe_block: 'lesson', jam_mulai: '12:55', jam_selesai: '13:35', urutan: 10, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 8', tipe_block: 'lesson', jam_mulai: '13:35', jam_selesai: '14:15', urutan: 11, warna: '#4F46E5', is_fixed: false },
      ],

      'MTs': [
        { nama_block: 'Sholat Dhuha', tipe_block: 'prayer', jam_mulai: '07:00', jam_selesai: '07:20', urutan: 0, warna: '#8B5CF6', is_fixed: true },
        { nama_block: 'Jam 1', tipe_block: 'lesson', jam_mulai: '07:20', jam_selesai: '08:00', urutan: 1, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 2', tipe_block: 'lesson', jam_mulai: '08:00', jam_selesai: '08:40', urutan: 2, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 3', tipe_block: 'lesson', jam_mulai: '08:40', jam_selesai: '09:20', urutan: 3, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat', tipe_block: 'break', jam_mulai: '09:20', jam_selesai: '09:35', urutan: 4, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 4', tipe_block: 'lesson', jam_mulai: '09:35', jam_selesai: '10:15', urutan: 5, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 5', tipe_block: 'lesson', jam_mulai: '10:15', jam_selesai: '10:55', urutan: 6, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 6', tipe_block: 'lesson', jam_mulai: '10:55', jam_selesai: '11:35', urutan: 7, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Sholat Dzuhur', tipe_block: 'prayer', jam_mulai: '11:35', jam_selesai: '12:05', urutan: 8, warna: '#8B5CF6', is_fixed: true },
        { nama_block: 'Istirahat 2', tipe_block: 'break', jam_mulai: '12:05', jam_selesai: '12:20', urutan: 9, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 7', tipe_block: 'lesson', jam_mulai: '12:20', jam_selesai: '13:00', urutan: 10, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 8', tipe_block: 'lesson', jam_mulai: '13:00', jam_selesai: '13:40', urutan: 11, warna: '#4F46E5', is_fixed: false },
      ],

      'SMA': [
        { nama_block: 'Jam 1', tipe_block: 'lesson', jam_mulai: '07:00', jam_selesai: '07:45', urutan: 1, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 2', tipe_block: 'lesson', jam_mulai: '07:45', jam_selesai: '08:30', urutan: 2, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 3', tipe_block: 'lesson', jam_mulai: '08:30', jam_selesai: '09:15', urutan: 3, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat 1', tipe_block: 'break', jam_mulai: '09:15', jam_selesai: '09:30', urutan: 4, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 4', tipe_block: 'lesson', jam_mulai: '09:30', jam_selesai: '10:15', urutan: 5, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 5', tipe_block: 'lesson', jam_mulai: '10:15', jam_selesai: '11:00', urutan: 6, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 6', tipe_block: 'lesson', jam_mulai: '11:00', jam_selesai: '11:45', urutan: 7, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Sholat & Istirahat', tipe_block: 'break', jam_mulai: '11:45', jam_selesai: '12:30', urutan: 8, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 7', tipe_block: 'lesson', jam_mulai: '12:30', jam_selesai: '13:15', urutan: 9, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 8', tipe_block: 'lesson', jam_mulai: '13:15', jam_selesai: '14:00', urutan: 10, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 9', tipe_block: 'lesson', jam_mulai: '14:00', jam_selesai: '14:45', urutan: 11, warna: '#4F46E5', is_fixed: false },
      ],

      'MA': [
        { nama_block: 'Sholat Dhuha', tipe_block: 'prayer', jam_mulai: '06:45', jam_selesai: '07:05', urutan: 0, warna: '#8B5CF6', is_fixed: true },
        { nama_block: 'Jam 1', tipe_block: 'lesson', jam_mulai: '07:05', jam_selesai: '07:50', urutan: 1, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 2', tipe_block: 'lesson', jam_mulai: '07:50', jam_selesai: '08:35', urutan: 2, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 3', tipe_block: 'lesson', jam_mulai: '08:35', jam_selesai: '09:20', urutan: 3, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat 1', tipe_block: 'break', jam_mulai: '09:20', jam_selesai: '09:35', urutan: 4, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 4', tipe_block: 'lesson', jam_mulai: '09:35', jam_selesai: '10:20', urutan: 5, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 5', tipe_block: 'lesson', jam_mulai: '10:20', jam_selesai: '11:05', urutan: 6, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 6', tipe_block: 'lesson', jam_mulai: '11:05', jam_selesai: '11:50', urutan: 7, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Sholat Dzuhur', tipe_block: 'prayer', jam_mulai: '11:50', jam_selesai: '12:20', urutan: 8, warna: '#8B5CF6', is_fixed: true },
        { nama_block: 'Istirahat 2', tipe_block: 'break', jam_mulai: '12:20', jam_selesai: '12:35', urutan: 9, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 7', tipe_block: 'lesson', jam_mulai: '12:35', jam_selesai: '13:20', urutan: 10, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 8', tipe_block: 'lesson', jam_mulai: '13:20', jam_selesai: '14:05', urutan: 11, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 9', tipe_block: 'lesson', jam_mulai: '14:05', jam_selesai: '14:50', urutan: 12, warna: '#4F46E5', is_fixed: false },
      ],

      'SMK': [
        { nama_block: 'Jam 1', tipe_block: 'lesson', jam_mulai: '07:00', jam_selesai: '07:45', urutan: 1, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 2', tipe_block: 'lesson', jam_mulai: '07:45', jam_selesai: '08:30', urutan: 2, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 3', tipe_block: 'lesson', jam_mulai: '08:30', jam_selesai: '09:15', urutan: 3, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Istirahat 1', tipe_block: 'break', jam_mulai: '09:15', jam_selesai: '09:30', urutan: 4, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 4', tipe_block: 'lesson', jam_mulai: '09:30', jam_selesai: '10:15', urutan: 5, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 5', tipe_block: 'lesson', jam_mulai: '10:15', jam_selesai: '11:00', urutan: 6, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 6', tipe_block: 'lesson', jam_mulai: '11:00', jam_selesai: '11:45', urutan: 7, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Sholat & Istirahat', tipe_block: 'break', jam_mulai: '11:45', jam_selesai: '12:30', urutan: 8, warna: '#10B981', is_fixed: true },
        { nama_block: 'Jam 7', tipe_block: 'lesson', jam_mulai: '12:30', jam_selesai: '13:15', urutan: 9, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 8', tipe_block: 'lesson', jam_mulai: '13:15', jam_selesai: '14:00', urutan: 10, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 9', tipe_block: 'lesson', jam_mulai: '14:00', jam_selesai: '14:45', urutan: 11, warna: '#4F46E5', is_fixed: false },
        { nama_block: 'Jam 10', tipe_block: 'lesson', jam_mulai: '14:45', jam_selesai: '15:30', urutan: 12, warna: '#4F46E5', is_fixed: false },
      ],
    };

    return templates[jenjang] || templates['SD'];
  },

  /**
   * Validate time blocks (no overlap)
   */
  validateTimeBlocks(blocks: CreateTimeBlockInput[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for overlapping times
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const block1 = blocks[i];
        const block2 = blocks[j];

        const start1 = block1.jam_mulai;
        const end1 = block1.jam_selesai;
        const start2 = block2.jam_mulai;
        const end2 = block2.jam_selesai;

        // Check overlap
        if (
          (start1 < end2 && end1 > start2) ||
          (start2 < end1 && end2 > start1)
        ) {
          errors.push(
            `Waktu overlap: ${block1.nama_block} (${start1}-${end1}) dengan ${block2.nama_block} (${start2}-${end2})`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};