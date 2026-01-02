// src/services/scheduleService.ts - FIXED FIELD NAMES
import { supabase } from '@/lib/supabase';
import type { ScheduleSlot } from '@/types/database.types';

export interface CreateScheduleSlotInput {
  ga_run_id: number;
  kelas_id: number;
  guru_id: number;
  mapel_id: number;
  hari: string;
  blok_waktu_id: number;
  jam_ke?: number;
}

export interface ScheduleSlotWithDetails extends ScheduleSlot {
  kelas: { 
    id: number; 
    nama_kelas: string;
    tingkat?: number;
    hari_aktif?: string[];
  };
  guru: { 
    id: number; 
    nama: string;
    jam_maks?: number;
    hari_tidak_bisa?: string;
  };
  mapel: { 
    id: number; 
    nama_mapel: string;
  };
  blok_waktu?: { 
    id: number; 
    nama_block: string; 
    jam_mulai: string; 
    jam_selesai: string;
    urutan: number;
    warna?: string;
    is_non_jp: boolean;
    is_tetap: boolean;
  };
}

export const scheduleService = {
  async saveBulk(slots: CreateScheduleSlotInput[]): Promise<ScheduleSlot[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .insert(slots)
      .select();

    if (error) throw new Error(error.message);
    return data || [];
  },

  async getByGARunId(gaRunId: number): Promise<ScheduleSlotWithDetails[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas, tingkat, hari_aktif),
        guru:guru_id (id, nama, jam_maks, hari_tidak_bisa),
        mapel:mapel_id (id, nama_mapel),
        blok_waktu:blok_waktu_id (
          id, nama_block, jam_mulai, jam_selesai, urutan, 
          warna, is_non_jp, is_tetap
        )
      `)
      .eq('ga_run_id', gaRunId)
      .order('hari', { ascending: true })
      .order('jam_ke', { ascending: true });

    if (error) throw new Error(error.message);
    return (data as any) || [];
  },

  async getByClass(gaRunId: number, kelasId: number): Promise<ScheduleSlotWithDetails[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas, tingkat, hari_aktif),
        guru:guru_id (id, nama, jam_maks, hari_tidak_bisa),
        mapel:mapel_id (id, nama_mapel),
        blok_waktu:blok_waktu_id (
          id, nama_block, jam_mulai, jam_selesai, urutan, 
          warna, is_non_jp, is_tetap
        )
      `)
      .eq('ga_run_id', gaRunId)
      .eq('kelas_id', kelasId)
      .order('hari', { ascending: true })
      .order('jam_ke', { ascending: true });

    if (error) throw new Error(error.message);
    return (data as any) || [];
  },

  async getByTeacher(gaRunId: number, guruId: number): Promise<ScheduleSlotWithDetails[]> {
    const { data, error } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas, tingkat, hari_aktif),
        guru:guru_id (id, nama, jam_maks, hari_tidak_bisa),
        mapel:mapel_id (id, nama_mapel),
        blok_waktu:blok_waktu_id (
          id, nama_block, jam_mulai, jam_selesai, urutan, 
          warna, is_non_jp, is_tetap
        )
      `)
      .eq('ga_run_id', gaRunId)
      .eq('guru_id', guruId)
      .order('hari', { ascending: true })
      .order('jam_ke', { ascending: true });

    if (error) throw new Error(error.message);
    return (data as any) || [];
  },

  async deleteByGARunId(gaRunId: number): Promise<void> {
    const { error } = await supabase
      .from('jadwal_slot')
      .delete()
      .eq('ga_run_id', gaRunId);

    if (error) throw new Error(error.message);
  },

  async checkConflicts(gaRunId: number): Promise<{
    teacherConflicts: Array<{ key: string; slots: any[]; description: string }>;
    classConflicts: Array<{ key: string; slots: any[]; description: string }>;
  }> {
    const { data: slots, error } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (nama_kelas),
        guru:guru_id (nama),
        mapel:mapel_id (nama_mapel)
      `)
      .eq('ga_run_id', gaRunId);

    if (error) throw new Error(error.message);

    const teacherConflicts: Array<{ key: string; slots: any[]; description: string }> = [];
    const classConflicts: Array<{ key: string; slots: any[]; description: string }> = [];

    // Teacher conflicts
    const teacherMap = new Map<string, any[]>();
    slots?.forEach(slot => {
      const key = `${slot.guru_id}-${slot.hari}-${slot.blok_waktu_id}`;
      if (!teacherMap.has(key)) teacherMap.set(key, []);
      teacherMap.get(key)!.push(slot);
    });

    teacherMap.forEach((slotArray, key) => {
      if (slotArray.length > 1) {
        teacherConflicts.push({
          key,
          slots: slotArray,
          description: `Guru ${slotArray[0].guru?.nama} mengajar ${slotArray.length} kelas di ${slotArray[0].hari}`
        });
      }
    });

    // Class conflicts
    const classMap = new Map<string, any[]>();
    slots?.forEach(slot => {
      const key = `${slot.kelas_id}-${slot.hari}-${slot.blok_waktu_id}`;
      if (!classMap.has(key)) classMap.set(key, []);
      classMap.get(key)!.push(slot);
    });

    classMap.forEach((slotArray, key) => {
      if (slotArray.length > 1) {
        classConflicts.push({
          key,
          slots: slotArray,
          description: `Kelas ${slotArray[0].kelas?.nama_kelas} punya ${slotArray.length} mapel di ${slotArray[0].hari}`
        });
      }
    });

    return { teacherConflicts, classConflicts };
  },

  async getStatistics(gaRunId: number): Promise<{
    totalSlots: number;
    totalClasses: number;
    totalTeachers: number;
    slotsByDay: Record<string, number>;
  }> {
    const slots = await this.getByGARunId(gaRunId);
    
    const uniqueClasses = new Set(slots.map(s => s.kelas_id));
    const uniqueTeachers = new Set(slots.map(s => s.guru_id));
    
    const slotsByDay: Record<string, number> = {};
    slots.forEach(slot => {
      slotsByDay[slot.hari] = (slotsByDay[slot.hari] || 0) + 1;
    });

    return {
      totalSlots: slots.length,
      totalClasses: uniqueClasses.size,
      totalTeachers: uniqueTeachers.size,
      slotsByDay
    };
  }
};