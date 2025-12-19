// src/services/scheduleService.ts - UPDATED: Removed ruang references
import { supabase } from '@/lib/supabase';
import type { ScheduleSlot } from '@/types/database.types';

// ✅ UPDATED: Removed ruang_id
export interface CreateScheduleSlotInput {
  ga_run_id: number;
  kelas_id: number;
  guru_id: number;
  mapel_id: number;
  // ❌ REMOVED: ruang_id: number;
  hari: string;
  time_block_id?: number;
  jam_ke?: number;
}

// ✅ UPDATED: Removed ruang from relations
export interface ScheduleSlotWithDetails extends ScheduleSlot {
  kelas: { id: number; nama_kelas: string };
  guru: { id: number; nama: string };
  mapel: { id: number; nama_mapel: string };
  // ❌ REMOVED: ruang: { id: number; nama_ruang: string };
  time_block?: { 
    id: number; 
    nama_block: string; 
    jam_mulai: string; 
    jam_selesai: string;
    tipe_block: string;
  };
}

export const scheduleService = {

  /**
   * Insert multiple schedule slots at once
   */
  async saveBulk(slots: CreateScheduleSlotInput[]): Promise<ScheduleSlot[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .insert(slots)
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Get schedule by GA run ID
   * ✅ UPDATED: Removed ruang from select
   */
  async getByGARunId(gaRunId: number): Promise<ScheduleSlotWithDetails[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas),
        guru:guru_id (id, nama),
        mapel:mapel_id (id, nama_mapel),
        time_block:time_blocks!jadwal_slot_time_block_id_fkey (
          id, 
          nama_block, 
          jam_mulai, 
          jam_selesai,
          tipe_block
        )
      `)
      .eq('ga_run_id', gaRunId)
      .order('hari', { ascending: true })
      .order('jam_ke', { ascending: true });

    if (error) throw error;
    return (data as any) || [];
  },

  /**
   * Get schedule for specific class
   * ✅ UPDATED: Removed ruang from select
   */
  async getByClass(gaRunId: number, kelasId: number): Promise<ScheduleSlotWithDetails[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas),
        guru:guru_id (id, nama),
        mapel:mapel_id (id, nama_mapel),
        time_block:time_blocks!jadwal_slot_time_block_id_fkey (
          id, 
          nama_block, 
          jam_mulai, 
          jam_selesai,
          tipe_block
        )
      `)
      .eq('ga_run_id', gaRunId)
      .eq('kelas_id', kelasId)
      .order('hari', { ascending: true })
      .order('jam_ke', { ascending: true });

    if (error) throw error;
    return (data as any) || [];
  },

  /**
   * Get schedule for specific teacher
   * ✅ UPDATED: Removed ruang from select
   */
  async getByTeacher(gaRunId: number, guruId: number): Promise<ScheduleSlotWithDetails[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas),
        guru:guru_id (id, nama),
        mapel:mapel_id (id, nama_mapel),
        time_block:time_blocks!jadwal_slot_time_block_id_fkey (
          id, 
          nama_block, 
          jam_mulai, 
          jam_selesai,
          tipe_block
        )
      `)
      .eq('ga_run_id', gaRunId)
      .eq('guru_id', guruId)
      .order('hari', { ascending: true })
      .order('jam_ke', { ascending: true });

    if (error) throw error;
    return (data as any) || [];
  },

  /**
   * Delete all schedule slots for GA Run ID
   */
  async deleteGaRunById(gaRunId: number): Promise<void> {
    const { error } = await supabase
      .from('jadwal_slot')
      .delete()
      .eq('ga_run_id', gaRunId);

    if (error) throw error;
  },

  async deleteByGARunId(id: number): Promise<void> {
    const { error } = await supabase
      .from('ga_run')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Check for teacher conflicts
   * ❌ REMOVED: Room conflicts check
   */
  async checkConflicts(gaRunId: number): Promise<{
    teacherConflicts: any[];
  }> {
    const { data: slots, error } = await supabase
      .from('jadwal_slot')
      .select('*')
      .eq('ga_run_id', gaRunId);

    if (error) throw error;

    const teacherConflicts: any[] = [];

    // Teacher conflict logic
    const teacherMap = new Map<string, ScheduleSlot[]>();
    slots?.forEach(slot => {
      const key = `${slot.guru_id}-${slot.hari}-${slot.time_block_id || slot.jam_ke}`;
      if (!teacherMap.has(key)) teacherMap.set(key, []);
      teacherMap.get(key)!.push(slot);
    });

    teacherMap.forEach((arr, key) => {
      if (arr.length > 1) teacherConflicts.push({ key, slots: arr });
    });

    // ❌ REMOVED: Room conflict detection

    return { teacherConflicts };
  },
};