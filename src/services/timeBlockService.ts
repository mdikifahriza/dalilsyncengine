// src/services/timeBlockService.ts - REVISED for Database Schema
import { supabase } from '@/lib/supabase';
import type {
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  JPStatistics,
} from '@/types/database.types';

export const timeBlockService = {
  /**
   * Get all time blocks for user
   */
  async getAll(userId: string): Promise<TimeBlock[]> {
    const { data, error } = await supabase
      .from('blok_waktu')
      .select('*')
      .eq('user_id', userId)
      .order('urutan', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  /**
   * Get lesson blocks only (for GA) - excludes non-JP blocks
   */
  async getLessonBlocks(userId: string): Promise<TimeBlock[]> {
    const { data, error } = await supabase
      .from('blok_waktu')
      .select('*')
      .eq('user_id', userId)
      .eq('is_non_jp', false)  // Hanya blok JP (bukan Non-JP)
      .order('urutan', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  /**
   * Get by ID
   */
  async getById(id: number): Promise<TimeBlock> {
    const { data, error } = await supabase
      .from('blok_waktu')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

async getBlocksForGA(userId: string): Promise<TimeBlock[]> {
    const { data, error } = await supabase
      .from('blok_waktu')
      .select('*')
      .eq('user_id', userId)
      .eq('is_non_jp', false) // Tetap filter istirahat
      // JANGAN filter is_tetap di sini agar slot 39 itu muncul semua
      .order('urutan', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },
  
  async create(userId: string, input: CreateTimeBlockInput): Promise<TimeBlock> {
    const { data, error } = await supabase
      .from('blok_waktu')
      .insert({
        user_id: userId,
        ...input,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Bulk create time blocks
   */
  async createBulk(userId: string, blocks: CreateTimeBlockInput[]): Promise<TimeBlock[]> {
    const blocksWithUser = blocks.map(b => ({
      user_id: userId,
      ...b,
    }));

    const { data, error } = await supabase
      .from('blok_waktu')
      .insert(blocksWithUser)
      .select();

    if (error) throw new Error(error.message);
    return data || [];
  },

  /**
   * Update time block
   */
  async update(id: number, userId: string, input: UpdateTimeBlockInput): Promise<TimeBlock> {
    const { data, error } = await supabase
      .from('blok_waktu')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Delete time block (CASCADE: also deletes related data)
   */
  async delete(id: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('blok_waktu')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  /**
   * Delete all time blocks for user
   */
  async deleteAll(userId: string): Promise<void> {
    const { error } = await supabase
      .from('blok_waktu')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  /**
   * Copy time blocks from one kelas to another per hari
   * - Does NOT copy block IDs (creates new records with same attributes)
   * - Does NOT copy fixed schedules (is_tetap=true blocks are skipped)
   * - Copies from specific source hari to target hari
   */
  async copyBlocksByDay(
    userId: string,
    sourceKelasId: number,
    sourceHari: string,
    targetKelasId: number,
    targetHari: string
  ): Promise<void> {
    // Get source blocks - FILTER OUT is_tetap=true (fixed schedules) and match sourceHari
    const { data: sourceBlocks, error: fetchError } = await supabase
      .from('blok_waktu')
      .select('*')
      .eq('user_id', userId)
      .eq('kelas_id', sourceKelasId)
      .eq('hari', sourceHari)  // Match specific hari
      .eq('is_tetap', false);  // SKIP fixed schedules

    if (fetchError) throw new Error(fetchError.message);

    if (!sourceBlocks || sourceBlocks.length === 0) {
      throw new Error(`Tidak ada blok waktu di kelas/hari sumber (${sourceHari}) (atau semua adalah JP Tetap)`);
    }

    // Delete existing blocks in target hari
    await supabase
      .from('blok_waktu')
      .delete()
      .eq('user_id', userId)
      .eq('kelas_id', targetKelasId)
      .eq('hari', targetHari)  // Delete only for target hari
      .eq('is_tetap', false);  // Only delete non-fixed blocks

    // Insert to target - CREATE NEW RECORDS with target kelas_id and targetHari
    const newBlocks = sourceBlocks.map(block => ({
      user_id: userId,
      kelas_id: targetKelasId,  // REPLACE with target kelas_id
      nama_block: block.nama_block,
      jam_mulai: block.jam_mulai,
      jam_selesai: block.jam_selesai,
      urutan: block.urutan,
      hari: targetHari,  // REPLACE with target hari
      warna: block.warna,
      is_non_jp: block.is_non_jp,
      is_tetap: false,  // Always false for copied blocks
      mapel_kelas_id: null,  // Don't copy mapel_kelas_id (belongs to source kelas)
    }));

    const { error: insertError } = await supabase
      .from('blok_waktu')
      .insert(newBlocks);

    if (insertError) throw new Error(insertError.message);
  },

  /**
   * Get JP statistics for all classes
   */
  async getJPStatistics(userId: string): Promise<JPStatistics[]> {
    // Get all classes
    const { data: classes, error: classError } = await supabase
      .from('kelas')
      .select('id, nama_kelas')
      .eq('user_id', userId);

    if (classError) throw new Error(classError.message);

    const statistics: JPStatistics[] = [];

    for (const kelas of classes || []) {
      // Get JP from curriculum
      const { data: mapelKelas, error: mkError } = await supabase
        .from('mapel_kelas')
        .select('jumlah_jam_per_minggu')
        .eq('kelas_id', kelas.id);

      if (mkError) throw new Error(mkError.message);

      const jp_kurikulum = mapelKelas?.reduce((sum, mk) => sum + mk.jumlah_jam_per_minggu, 0) || 0;

      // Get JP blocks count (lesson blocks that are not non-JP)
      const { data: blocks, error: blockError } = await supabase
        .from('blok_waktu')
        .select('is_non_jp')
        .eq('kelas_id', kelas.id);

      if (blockError) throw new Error(blockError.message);

      let jp_blocks = 0;
      let non_jp_blocks = 0;

      for (const block of blocks || []) {
        if (!block.is_non_jp) {
          jp_blocks++;
        } else {
          non_jp_blocks++;
        }
      }

      statistics.push({
        kelas_id: kelas.id,
        kelas_nama: kelas.nama_kelas,
        jp_kurikulum,
        jp_blocks,
        non_jp_blocks,
        difference: jp_blocks - jp_kurikulum,
        is_valid: jp_blocks >= jp_kurikulum,
      });
    }

    return statistics;
  },

  validateTimeBlocks(blocks: CreateTimeBlockInput[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const block1 = blocks[i];
        const block2 = blocks[j];

        const start1 = block1.jam_mulai;
        const end1 = block1.jam_selesai;
        const start2 = block2.jam_mulai;
        const end2 = block2.jam_selesai;

        if ((start1 < end2 && end1 > start2)) {
          errors.push(
            `Overlap: ${block1.nama_block} vs ${block2.nama_block}`
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