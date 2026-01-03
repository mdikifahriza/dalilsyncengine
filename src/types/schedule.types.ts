// src/types/schedule.types.ts
import type { TimeBlock, MapelKelasWithRelations } from './database.types';
import type { ScheduleSlotWithDetails } from '@/services/scheduleService';

/**
 * Unified schedule slot yang menggabungkan 3 tipe:
 * 1. Non-JP (is_non_jp=true)
 * 2. JP Tetap (is_non_jp=false, is_tetap=true, mapel_kelas_id≠null)
 * 3. JP Biasa (is_non_jp=false, is_tetap=false) dari GA
 */
export interface EnhancedScheduleSlot {
  blok_waktu_id: number;
  kelas_id: number;
  hari: string;
  urutan: number;
  jam_mulai: string;
  jam_selesai: string;
  nama_block: string;
  warna: string;
  
  // Type indicator
  type: 'non-jp' | 'jp-tetap' | 'jp-biasa';
  
  // For non-jp (just display name)
  // nama_block already has it
  
  // For jp-tetap (from mapel_kelas)
  mapel_tetap?: {
    mapel_nama: string;
    guru_nama: string;
    mapel_kelas_id: number;
  };
  
  // For jp-biasa (from jadwal_slot / GA result)
  jadwal_slot?: {
    mapel_nama: string;
    guru_nama: string;
    slot_id: number;
  };
}

/**
 * Schedule grouped by day
 */
export interface ScheduleByDay {
  hari: string;
  slots: EnhancedScheduleSlot[];
}

/**
 * Schedule grouped by class
 */
export interface ScheduleByClass {
  kelas_id: number;
  kelas_nama: string;
  tingkat?: number;
  days: ScheduleByDay[];
}
