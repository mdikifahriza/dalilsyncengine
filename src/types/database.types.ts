// Database types matching Supabase schema
export interface Database {
  public: {
    Tables: {
      guru: {
        Row: {
          id: number;
          user_id: string;
          nama: string;
          mapel_id: number;
          jam_maks: number;
          hari_tidak_bisa: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["guru"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["guru"]["Insert"]>;
      };

      mapel: {
        Row: {
          id: number;
          user_id: string;
          nama_mapel: string;
          jumlah_jam_per_minggu: number;
          ruang_khusus: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["mapel"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["mapel"]["Insert"]>;
      };

      kelas: {
        Row: {
          id: number;
          user_id: string;
          nama_kelas: string;
          tingkat: number | null;
          jurusan: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["kelas"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["kelas"]["Insert"]>;
      };

      ruang: {
        Row: {
          id: number;
          user_id: string;
          nama_ruang: string;
          kapasitas: number;
          tipe_ruang: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ruang"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["ruang"]["Insert"]>;
      };

      ga_run: {
        Row: {
          id: number;
          user_id: string | null; // bisa null jika run otomatis
          timestamp_start: string;
          timestamp_end: string | null;
          max_generations: number;
          population_size: number;
          final_fitness: number | null;
          generation_count: number | null;
          status: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ga_run"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["ga_run"]["Insert"]>;
      };

      jadwal_slot: {
        Row: {
          id: number;
          ga_run_id: number;
          kelas_id: number;
          guru_id: number;
          mapel_id: number;
          ruang_id: number;
          hari: string;
          jam_ke: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["jadwal_slot"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["jadwal_slot"]["Insert"]>;
      };
    };
  };
}

// === Auth user types (karena public.users sudah dihapus) ===
export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: string | null;
}

// Type aliases for easier usage
export type Teacher = Database["public"]["Tables"]["guru"]["Row"];
export type Subject = Database["public"]["Tables"]["mapel"]["Row"];
export type ClassGroup = Database["public"]["Tables"]["kelas"]["Row"];
export type Room = Database["public"]["Tables"]["ruang"]["Row"];
export type GARun = Database["public"]["Tables"]["ga_run"]["Row"];
export type ScheduleSlot =
  Database["public"]["Tables"]["jadwal_slot"]["Row"];
