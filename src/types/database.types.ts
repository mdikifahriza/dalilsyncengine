// src/types/database.types.ts - EXTENDED VERSION
// Add these to your existing types

export type Jenjang = 'TK' | 'PAUD' | 'SD' | 'MI' | 'SMP' | 'MTs' | 'SMA' | 'MA' | 'SMK';
export type ModelSekolah = 'Reguler' | 'Boarding' | 'Mandiri' | 'Internasional';
export type TipeBlock = 'lesson' | 'break' | 'prayer' | 'event';
export type Prioritas = 1 | 2 | 3; // 1=wajib, 2=muatan lokal, 3=ekstrakurikuler

// =====================================================
// NEW TYPES
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
// EXTENDED EXISTING TYPES
// =====================================================

export interface ClassGroup {
  id: number;
  user_id: string;
  nama_kelas: string;
  tingkat?: number;
  jurusan?: string;
  
  // NEW FIELDS
  jam_mulai?: string; // "07:00:00"
  jam_selesai?: string; // "15:00:00"
  hari_operasional?: string[];
  ruang_default_id?: number;
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
  ruang_id: number;
  hari: string;
  jam_ke?: number; // Now optional
  
  // NEW FIELDS
  time_block_id?: number;
  keterangan?: string;
  
  created_at: string;
}

// =====================================================
// WITH RELATIONS (for joins)
// =====================================================

export interface MapelKelasWithRelations extends MapelKelas {
  kelas?: ClassGroup;
  mapel?: Subject;
  guru?: Teacher;
}

export interface ScheduleSlotWithDetails extends ScheduleSlot {
  kelas: ClassGroup;
  guru: Teacher;
  mapel: Subject;
  ruang: Room;
  time_block?: TimeBlock;
}

export interface TimeBlockWithStats extends TimeBlock {
  slot_count?: number; // jumlah jadwal yang pakai block ini
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

export interface CreateMapelKelasInput {
  kelas_id: number;
  mapel_id: number;
  guru_id?: number;
  jumlah_jam_per_minggu: number;
  prioritas?: Prioritas;
  catatan?: string;
}

export interface UpdateMapelKelasInput extends Partial<CreateMapelKelasInput> {}

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