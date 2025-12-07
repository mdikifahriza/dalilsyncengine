import { supabase } from '@/lib/supabase';
import type { ScheduleSlot } from '@/types/database.types';

export interface CreateScheduleSlotInput {
  ga_run_id: number;
  kelas_id: number;
  guru_id: number;
  mapel_id: number;
  ruang_id: number;
  hari: string;
  jam_ke: number;
}

export interface ScheduleSlotWithDetails extends ScheduleSlot {
  kelas: { id: number; nama_kelas: string };
  guru: { id: number; nama: string };
  mapel: { id: number; nama_mapel: string };
  ruang: { id: number; nama_ruang: string };
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
   */
  async getByGARunId(gaRunId: number): Promise<ScheduleSlotWithDetails[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas),
        guru:guru_id (id, nama),
        mapel:mapel_id (id, nama_mapel),
        ruang:ruang_id (id, nama_ruang)
      `)
      .eq('ga_run_id', gaRunId)
      .order('hari', { ascending: true })
      .order('jam_ke', { ascending: true });

    if (error) throw error;
    return (data as any) || [];
  },

  /**
   * Get schedule for specific class
   */
  async getByClass(gaRunId: number, kelasId: number): Promise<ScheduleSlotWithDetails[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas),
        guru:guru_id (id, nama),
        mapel:mapel_id (id, nama_mapel),
        ruang:ruang_id (id, nama_ruang)
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
   */
  async getByTeacher(gaRunId: number, guruId: number): Promise<ScheduleSlotWithDetails[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas),
        guru:guru_id (id, nama),
        mapel:mapel_id (id, nama_mapel),
        ruang:ruang_id (id, nama_ruang)
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
   * Check for teacher & room time conflicts
   */
  async checkConflicts(gaRunId: number): Promise<{
    teacherConflicts: any[];
    roomConflicts: any[];
  }> {

    const { data: slots, error } = await supabase
      .from('jadwal_slot')
      .select('*')
      .eq('ga_run_id', gaRunId);

    if (error) throw error;

    const teacherConflicts: any[] = [];
    const roomConflicts: any[] = [];

    // Teacher conflict logic
    const teacherMap = new Map<string, ScheduleSlot[]>();
    slots?.forEach(slot => {
      const key = `${slot.guru_id}-${slot.hari}-${slot.jam_ke}`;
      if (!teacherMap.has(key)) teacherMap.set(key, []);
      teacherMap.get(key)!.push(slot);
    });

    teacherMap.forEach((arr, key) => {
      if (arr.length > 1) teacherConflicts.push({ key, slots: arr });
    });

    // Room conflict logic
    const roomMap = new Map<string, ScheduleSlot[]>();
    slots?.forEach(slot => {
      const key = `${slot.ruang_id}-${slot.hari}-${slot.jam_ke}`;
      if (!roomMap.has(key)) roomMap.set(key, []);
      roomMap.get(key)!.push(slot);
    });

    roomMap.forEach((arr, key) => {
      if (arr.length > 1) roomConflicts.push({ key, slots: arr });
    });

    return { teacherConflicts, roomConflicts };
  },
};
