// src/types/database.types.ts - UPDATED for Database Schema
// Fixed schedules are now embedded in TimeBlock (is_tetap + mapel_kelas_id)

export type Jenjang = 'TK' | 'PAUD' | 'SD' | 'MI' | 'SMP' | 'MTs' | 'SMA' | 'MA' | 'SMK';
export type ModelSekolah = 'Reguler' | 'Boarding' | 'Mandiri' | 'Internasional';

// =====================================================
// CORE TYPES
// =====================================================

export interface SchoolProfile {
  id: number;
  user_id: string;
  nama_sekolah: string;
  jenjang: Jenjang;
  model_sekolah?: ModelSekolah;
  zona_waktu: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeBlock {
  id: number;
  user_id: string;
  kelas_id: number;
  nama_block: string;
  jam_mulai: string;
  jam_selesai: string;
  urutan: number;
  hari: string;  // Wajib, string dari HARI_OPTIONS
  warna: string;
  is_non_jp: boolean;
  is_tetap: boolean; // Fixed schedule flag
  mapel_kelas_id?: number | null; // For fixed schedules
  created_at: string;
  updated_at: string;
}

export interface MapelKelas {
  id: number;
  user_id: string;
  kelas_id: number;
  mapel_id: number;
  guru_id?: number;
  jumlah_jam_per_minggu: number;
  created_at: string;
  updated_at: string;
}

export interface ScheduleTemplate {
  id: number;
  user_id: string;
  nama_template: string;
  jenjang: Jenjang;
  deskripsi?: string;
  time_blocks?: any;
  constraints?: any;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// MAIN ENTITY TYPES
// =====================================================

export interface Teacher {
  id: number;
  user_id: string;
  nama: string;
  jam_maks: number;
  hari_tidak_bisa?: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  user_id: string;
  nama_mapel: string;
  created_at: string;
  updated_at: string;
}

export interface ClassGroup {
  id: number;
  user_id: string;
  nama_kelas: string;
  tingkat?: number;
  jam_mulai?: string;
  jam_selesai?: string;
  hari_operasional?: string[];
  hari_aktif?: string[];
  wali_kelas?: string;
  jumlah_siswa?: number;
  created_at: string;
  updated_at: string;
}

export interface ScheduleSlot {
  id: number;
  ga_run_id: number;
  kelas_id: number;
  guru_id: number;
  mapel_id: number;
  hari: string;
  jam_ke?: number;
  time_block_id?: number;
  ruang_nama?: string;
  keterangan?: string;
  created_at: string;
}

// =====================================================
// WITH RELATIONS
// =====================================================

export interface TimeBlockWithRelations extends TimeBlock {
  slot_count?: number;
  mapel_kelas?: MapelKelasWithRelations;
}

export interface MapelKelasWithRelations extends MapelKelas {
  kelas?: ClassGroup;
  mapel?: Subject;
  guru?: Teacher;
}

export interface ScheduleSlotWithDetails extends ScheduleSlot {
  kelas: ClassGroup;
  guru: Teacher;
  mapel: Subject;
  time_block?: TimeBlock;
}

// =====================================================
// INPUT TYPES
// =====================================================

export interface CreateSchoolProfileInput {
  nama_sekolah: string;
  jenjang: Jenjang;
  model_sekolah?: ModelSekolah;
  zona_waktu?: string;
  logo_url?: string;
}

export interface UpdateSchoolProfileInput extends Partial<CreateSchoolProfileInput> {}

export interface CreateTimeBlockInput {
  kelas_id: number;
  nama_block: string;
  jam_mulai: string;
  jam_selesai: string;
  urutan: number;
  hari: string;  // Wajib
  warna?: string;
  is_non_jp?: boolean;
  is_tetap?: boolean;
  mapel_kelas_id?: number;
}

export interface UpdateTimeBlockInput extends Partial<CreateTimeBlockInput> {}

export interface CreateMapelKelasInput {
  kelas_id: number;
  mapel_id: number;
  guru_id?: number;
  jumlah_jam_per_minggu: number;
}

export interface UpdateMapelKelasInput extends Partial<CreateMapelKelasInput> {}

export interface CreateTeacherInput {
  nama: string;
  jam_maks: number;
  hari_tidak_bisa?: string;
}

export interface UpdateTeacherInput extends Partial<CreateTeacherInput> {}

export interface CreateSubjectInput {
  nama_mapel: string;
}

export interface UpdateSubjectInput extends Partial<CreateSubjectInput> {}

export interface CreateClassInput {
  nama_kelas: string;
  tingkat: number;
  jam_mulai?: string;
  jam_selesai?: string;
  hari_operasional?: string[];
  hari_aktif?: string[];
  wali_kelas?: string;
  jumlah_siswa?: number;
}

export interface UpdateClassInput extends Partial<CreateClassInput> {}

// =====================================================
// VALIDATION & UTILITY TYPES
// =====================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  details?: {
    kelas_id: number;
    kelas_nama: string;
    per_day: {
      [hari: string]: {
        required_jp: number;
        available_blocks: number;
        diff: number;
      };
    };
  }[];
}

export interface BlocksAvailability {
  kelas_id: number;
  per_day: {
    [hari: string]: number;
  };
  total: number;
}

export interface JPStatistics {
  kelas_id: number;
  kelas_nama: string;
  jp_kurikulum: number;
  jp_blocks: number;
  non_jp_blocks: number;
  difference: number;
  is_valid: boolean;
}

// =====================================================
// CONSTANTS
// =====================================================

export const JENJANG_OPTIONS: { value: Jenjang; label: string }[] = [
  { value: 'TK', label: 'TK (Taman Kanak-kanak)' },
  { value: 'PAUD', label: 'PAUD' },
  { value: 'SD', label: 'SD (Sekolah Dasar)' },
  { value: 'MI', label: 'MI (Madrasah Ibtidaiyah)' },
  { value: 'SMP', label: 'SMP (Sekolah Menengah Pertama)' },
  { value: 'MTs', label: 'MTs (Madrasah Tsanawiyah)' },
  { value: 'SMA', label: 'SMA (Sekolah Menengah Atas)' },
  { value: 'MA', label: 'MA (Madrasah Aliyah)' },
  { value: 'SMK', label: 'SMK (Sekolah Menengah Kejuruan)' },
];

export const MODEL_SEKOLAH_OPTIONS: { value: ModelSekolah; label: string }[] = [
  { value: 'Reguler', label: 'Reguler' },
  { value: 'Boarding', label: 'Boarding School' },
  { value: 'Mandiri', label: 'Sekolah Mandiri' },
  { value: 'Internasional', label: 'Internasional' },
];

export const HARI_OPTIONS = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];