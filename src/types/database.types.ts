// src/types/database.types.ts - UPDATED VERSION
// CHANGES:
// - REMOVED: Room interface, ruang_id from ScheduleSlot, ruang_default_id from ClassGroup
// - ADDED: TimeBlockKelas interface
// - UPDATED: ScheduleSlot (removed ruang_id, added ruang_nama optional)

export type Jenjang = 'TK' | 'PAUD' | 'SD' | 'MI' | 'SMP' | 'MTs' | 'SMA' | 'MA' | 'SMK';
export type ModelSekolah = 'Reguler' | 'Boarding' | 'Mandiri' | 'Internasional';
export type TipeBlock = 'lesson' | 'break' | 'prayer' | 'event';
export type Prioritas = 1 | 2 | 3; // 1=wajib, 2=muatan lokal, 3=ekstrakurikuler

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
  nama_block: string;
  tipe_block: TipeBlock;
  jam_mulai: string; // "07:00:00"
  jam_selesai: string; // "07:40:00"
  urutan: number;
  hari_berlaku?: string[] | null;
  warna: string;
  is_fixed: boolean;
  created_at: string;
}

// ✨ NEW: Junction table untuk time blocks per kelas
export interface TimeBlockKelas {
  id: number;
  kelas_id: number;
  time_block_id: number;
  hari?: string | null; // null = semua hari, 'Senin' = khusus Senin
  created_at: string;
}

export interface MapelKelas {
  id: number;
  user_id: string;
  kelas_id: number;
  mapel_id: number;
  guru_id?: number;
  jumlah_jam_per_minggu: number;
  prioritas: Prioritas;
  catatan?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleTemplate {
  id: number;
  user_id: string;
  nama_template: string;
  jenjang: Jenjang;
  deskripsi?: string;
  time_blocks?: any; // JSONB
  constraints?: any; // JSONB
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
  mapel_id: number;
  jam_maks: number;
  hari_tidak_bisa?: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  user_id: string;
  nama_mapel: string;
  jumlah_jam_per_minggu: number;
  ruang_khusus?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassGroup {
  id: number;
  user_id: string;
  nama_kelas: string;
  tingkat?: number;
  jurusan?: string;
  
  // Operating hours
  jam_mulai?: string; // "07:00:00"
  jam_selesai?: string; // "15:00:00"
  hari_operasional?: string[];
  
  // ❌ REMOVED: ruang_default_id
  wali_kelas?: string;
  jumlah_siswa?: number;
  
  created_at: string;
  updated_at: string;
}

// ❌ REMOVED: Room interface completely

export interface ScheduleSlot {
  id: number;
  ga_run_id: number;
  kelas_id: number;
  guru_id: number;
  mapel_id: number;
  // ❌ REMOVED: ruang_id
  hari: string;
  jam_ke?: number;
  
  // Time block reference
  time_block_id?: number;
  
  // ✨ NEW: Optional text field untuk ruang (jika perlu manual)
  ruang_nama?: string;
  keterangan?: string;
  
  created_at: string;
}

// =====================================================
// WITH RELATIONS (for joins)
// =====================================================

export interface TimeBlockWithRelations extends TimeBlock {
  slot_count?: number;
}

export interface TimeBlockKelasWithRelations extends TimeBlockKelas {
  kelas?: ClassGroup;
  time_block?: TimeBlock;
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
  // ❌ REMOVED: ruang field
  time_block?: TimeBlock;
}

// =====================================================
// INPUT TYPES (for forms)
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
  nama_block: string;
  tipe_block: TipeBlock;
  jam_mulai: string;
  jam_selesai: string;
  urutan: number;
  hari_berlaku?: string[];
  warna?: string;
  is_fixed?: boolean;
}

export interface UpdateTimeBlockInput extends Partial<CreateTimeBlockInput> {}

// ✨ NEW: Input untuk assign time blocks ke kelas
export interface AssignTimeBlockToKelasInput {
  kelas_id: number;
  time_block_id: number;
  hari?: string | null;
}

export interface CreateMapelKelasInput {
  kelas_id: number;
  mapel_id: number;
  guru_id?: number;
  jumlah_jam_per_minggu: number;
  prioritas?: Prioritas;
  catatan?: string;
}

export interface UpdateMapelKelasInput extends Partial<CreateMapelKelasInput> {}

export interface CreateTeacherInput {
  nama: string;
  mapel_id: number;
  jam_maks: number;
  hari_tidak_bisa?: string;
}

export interface UpdateTeacherInput extends Partial<CreateTeacherInput> {}

export interface CreateSubjectInput {
  nama_mapel: string;
  jumlah_jam_per_minggu: number;
  ruang_khusus?: string;
}

export interface UpdateSubjectInput extends Partial<CreateSubjectInput> {}

export interface CreateClassInput {
  nama_kelas: string;
  tingkat?: number;
  jurusan?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  hari_operasional?: string[];
  wali_kelas?: string;
  jumlah_siswa?: number;
}

export interface UpdateClassInput extends Partial<CreateClassInput> {}

// ❌ REMOVED: CreateRoomInput, UpdateRoomInput

// =====================================================
// VALIDATION & UTILITY TYPES
// =====================================================

// ✨ NEW: Untuk validasi JP vs blocks
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

// ✨ NEW: Untuk count available blocks per kelas per hari
export interface BlocksAvailability {
  kelas_id: number;
  per_day: {
    [hari: string]: number; // jumlah blocks tersedia
  };
  total: number;
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

export const TIPE_BLOCK_OPTIONS: { value: TipeBlock; label: string; color: string }[] = [
  { value: 'lesson', label: 'Jam Pelajaran', color: '#4F46E5' },
  { value: 'break', label: 'Istirahat', color: '#10B981' },
  { value: 'prayer', label: 'Ibadah', color: '#8B5CF6' },
  { value: 'event', label: 'Kegiatan', color: '#F59E0B' },
];

export const PRIORITAS_OPTIONS: { value: Prioritas; label: string }[] = [
  { value: 1, label: 'Wajib' },
  { value: 2, label: 'Muatan Lokal' },
  { value: 3, label: 'Ekstrakurikuler' },
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