// src/services/timeBlockKelasService.ts
// Service untuk mengelola assignment time blocks ke kelas
// Supports: per-class, per-day configurations

import { supabase } from '@/lib/supabase';
import type {
  TimeBlockKelas,
  TimeBlockKelasWithRelations,
  AssignTimeBlockToKelasInput,
  BlocksAvailability
} from '@/types/database.types';

export const timeBlockKelasService = {
  /**
   * Assign time block to kelas
   */
  async assign(
    kelasId: number,
    timeBlockId: number,
    hari?: string | null
  ): Promise<TimeBlockKelas> {
    const { data, error } = await supabase
      .from('time_blocks_kelas')
      .insert({
        kelas_id: kelasId,
        time_block_id: timeBlockId,
        hari: hari || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Bulk assign multiple time blocks to kelas
   */
  async bulkAssign(
    kelasId: number,
    assignments: { time_block_id: number; hari?: string | null }[]
  ): Promise<TimeBlockKelas[]> {
    const insertData = assignments.map(a => ({
      kelas_id: kelasId,
      time_block_id: a.time_block_id,
      hari: a.hari || null,
    }));

    const { data, error } = await supabase
      .from('time_blocks_kelas')
      .insert(insertData)
      .select();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Unassign time block from kelas
   */
  async unassign(
    kelasId: number,
    timeBlockId: number,
    hari?: string | null
  ): Promise<void> {
    let query = supabase
      .from('time_blocks_kelas')
      .delete()
      .eq('kelas_id', kelasId)
      .eq('time_block_id', timeBlockId);

    if (hari !== undefined) {
      if (hari === null) {
        query = query.is('hari', null);
      } else {
        query = query.eq('hari', hari);
      }
    }

    const { error } = await query;
    if (error) throw new Error(error.message);
  },

  /**
   * Get all time blocks assigned to a kelas
   */
  async getByKelas(kelasId: number): Promise<TimeBlockKelasWithRelations[]> {
    const { data, error } = await supabase
      .from('time_blocks_kelas')
      .select(`
        *,
        time_block:time_blocks(*)
      `)
      .eq('kelas_id', kelasId)
      .order('urutan', {
        foreignTable: 'time_block',
        ascending: true,
      });

    if (error) throw new Error(error.message);
    return data as TimeBlockKelasWithRelations[];
  },

  /**
   * Get time blocks for specific kelas and day
   */
  async getByKelasAndDay(
    kelasId: number,
    hari: string
  ): Promise<TimeBlockKelasWithRelations[]> {
    const { data, error } = await supabase
      .from('time_blocks_kelas')
      .select(`
        *,
        time_block:time_blocks(*)
      `)
      .eq('kelas_id', kelasId)
      .or(`hari.is.null,hari.eq.${hari}`)
      .order('urutan', {
        foreignTable: 'time_block',
        ascending: true,
      });

    if (error) throw new Error(error.message);
    return data as TimeBlockKelasWithRelations[];
  },

  /**
   * Delete all assignments for a kelas
   */
  async deleteByKelas(kelasId: number): Promise<void> {
    const { error } = await supabase
      .from('time_blocks_kelas')
      .delete()
      .eq('kelas_id', kelasId);

    if (error) throw new Error(error.message);
  },

  /**
   * Delete all assignments for a specific time block
   */
  async deleteByTimeBlock(timeBlockId: number): Promise<void> {
    const { error } = await supabase
      .from('time_blocks_kelas')
      .delete()
      .eq('time_block_id', timeBlockId);

    if (error) throw new Error(error.message);
  },

  /**
   * Get count of available lesson blocks per kelas per day
   */
  async getAvailableBlocksCount(
    kelasId: number,
    hari?: string
  ): Promise<number> {
    let query = supabase
      .from('time_blocks_kelas')
      .select(
        'time_block:time_blocks!inner(*)',
        { count: 'exact', head: true }
      )
      .eq('kelas_id', kelasId)
      .eq('time_blocks.tipe_block', 'lesson');

    if (hari) {
      query = query.or(`hari.is.null,hari.eq.${hari}`);
    }

    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count || 0;
  },

  /**
   * Get detailed availability breakdown per day for a kelas
   */
  async getAvailabilityByKelas(
    kelasId: number,
    hariList: string[]
  ): Promise<BlocksAvailability> {
    const per_day: { [hari: string]: number } = {};

    const assignments = await this.getByKelas(kelasId);

    const lessonAssignments = assignments.filter(
      a => a.time_block?.tipe_block === 'lesson'
    );

    for (const hari of hariList) {
      const blocksForDay = lessonAssignments.filter(
        a => !a.hari || a.hari === hari
      );
      per_day[hari] = blocksForDay.length;
    }

    const total = Object.values(per_day).reduce((s, c) => s + c, 0);

    return {
      kelas_id: kelasId,
      per_day,
      total,
    };
  },

  /**
   * Copy time block assignments from one kelas to another
   */
  async copyFromKelas(
    sourceKelasId: number,
    targetKelasId: number
  ): Promise<void> {
    const sourceAssignments = await this.getByKelas(sourceKelasId);

    if (sourceAssignments.length === 0) {
      throw new Error('Kelas sumber tidak memiliki time blocks');
    }

    await this.deleteByKelas(targetKelasId);

    const assignments = sourceAssignments.map(a => ({
      time_block_id: a.time_block_id,
      hari: a.hari,
    }));

    await this.bulkAssign(targetKelasId, assignments);
  },

  /**
   * Check if a time block is assigned to any kelas
   */
  async isTimeBlockAssigned(timeBlockId: number): Promise<boolean> {
    const { count, error } = await supabase
      .from('time_blocks_kelas')
      .select('*', { count: 'exact', head: true })
      .eq('time_block_id', timeBlockId);

    if (error) throw new Error(error.message);
    return (count || 0) > 0;
  },

  /**
   * Get all kelas IDs that use a specific time block
   */
  async getKelasUsingTimeBlock(timeBlockId: number): Promise<number[]> {
    const { data, error } = await supabase
      .from('time_blocks_kelas')
      .select('kelas_id')
      .eq('time_block_id', timeBlockId);

    if (error) throw new Error(error.message);
    return [...new Set(data.map(d => d.kelas_id))];
  },
};
