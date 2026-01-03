// src/services/enhancedScheduleService.ts
import { supabase } from '@/lib/supabase';
import type { EnhancedScheduleSlot, ScheduleByClass } from '@/types/schedule.types';

export const enhancedScheduleService = {
  /**
   * Get enhanced schedule that combines:
   * 1. Non-JP blocks (is_non_jp=true)
   * 2. JP Tetap (is_tetap=true, mapel_kelas_id≠null)
   * 3. JP Biasa from GA (is_tetap=false)
   */
  async getEnhancedSchedule(gaRunId: number, userId: string): Promise<ScheduleByClass[]> {
    // 1. Get all time blocks for this user
    const { data: timeBlocks, error: tbError } = await supabase
      .from('blok_waktu')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas, tingkat, hari_aktif),
        mapel_kelas:mapel_kelas_id (
          id,
          mapel:mapel_id (nama_mapel),
          guru:guru_id (nama)
        )
      `)
      .eq('user_id', userId)
      .order('kelas_id', { ascending: true })
      .order('hari', { ascending: false })
      .order('urutan', { ascending: true });

    if (tbError) throw new Error(tbError.message);

    // 2. Get GA results (jadwal_slot) 
    const { data: jadwalSlots, error: jsError } = await supabase
      .from('jadwal_slot')
      .select(`
        *,
        kelas:kelas_id (id, nama_kelas, tingkat),
        guru:guru_id (id, nama),
        mapel:mapel_id (id, nama_mapel)
      `)
      .eq('ga_run_id', gaRunId);

    if (jsError) throw new Error(jsError.message);

    // 3. Build enhanced schedule
    return this.buildEnhancedSchedule(timeBlocks || [], jadwalSlots || []);
  },

  /**
   * Build enhanced schedule from time blocks and jadwal slots
   */
  buildEnhancedSchedule(timeBlocks: any[], jadwalSlots: any[]): ScheduleByClass[] {
    const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    // Group by kelas
    const byKelas = new Map<number, any>();
    
    timeBlocks.forEach(tb => {
      if (!byKelas.has(tb.kelas_id)) {
        byKelas.set(tb.kelas_id, {
          kelas_id: tb.kelas_id,
          kelas_nama: tb.kelas?.nama_kelas || `Kelas ${tb.kelas_id}`,
          tingkat: tb.kelas?.tingkat,
          hari_aktif: tb.kelas?.hari_aktif || HARI_OPTIONS,
          timeBlocks: []
        });
      }
      byKelas.get(tb.kelas_id)!.timeBlocks.push(tb);
    });

    // Build schedule for each class
    const result: ScheduleByClass[] = [];

    byKelas.forEach((kelasData, kelasId) => {
      const days = new Map<string, EnhancedScheduleSlot[]>();
      
      // Initialize days
      kelasData.hari_aktif.forEach((hari: string) => {
        days.set(hari, []);
      });

      // Process each time block
      kelasData.timeBlocks.forEach((tb: any) => {
        const slot: EnhancedScheduleSlot = {
          blok_waktu_id: tb.id,
          kelas_id: kelasId,
          hari: tb.hari,
          urutan: tb.urutan,
          jam_mulai: tb.jam_mulai,
          jam_selesai: tb.jam_selesai,
          nama_block: tb.nama_block,
          warna: tb.warna || '#6366F1',
          type: 'jp-biasa' // default
        };

        // Determine type
        if (tb.is_non_jp) {
          // Type 1: Non-JP block
          slot.type = 'non-jp';
        } else if (tb.is_tetap && tb.mapel_kelas_id) {
          // Type 2: JP Tetap (fixed schedule)
          slot.type = 'jp-tetap';
          const mk = tb.mapel_kelas;
          if (mk) {
            slot.mapel_tetap = {
              mapel_nama: mk.mapel?.nama_mapel || 'Unknown',
              guru_nama: mk.guru?.nama || 'Unknown',
              mapel_kelas_id: mk.id
            };
          }
        } else if (!tb.is_tetap) {
          // Type 3: JP Biasa from GA
          slot.type = 'jp-biasa';
          
          // Find matching jadwal_slot
          const js = jadwalSlots.find(
            (j: any) => j.blok_waktu_id === tb.id && j.kelas_id === kelasId && j.hari === tb.hari
          );
          
          if (js) {
            slot.jadwal_slot = {
              mapel_nama: js.mapel?.nama_mapel || 'Unknown',
              guru_nama: js.guru?.nama || 'Unknown',
              slot_id: js.id
            };
          }
        }

        // Add to corresponding day
        if (days.has(tb.hari)) {
          days.get(tb.hari)!.push(slot);
        }
      });

      // Convert to array and sort
      const daysArray = Array.from(days.entries()).map(([hari, slots]) => ({
        hari,
        slots: slots.sort((a, b) => a.urutan - b.urutan)
      }));

      // Sort by day order
      daysArray.sort((a, b) => {
        const indexA = HARI_OPTIONS.indexOf(a.hari);
        const indexB = HARI_OPTIONS.indexOf(b.hari);
        return indexA - indexB;
      });

      result.push({
        kelas_id: kelasId,
        kelas_nama: kelasData.kelas_nama,
        tingkat: kelasData.tingkat,
        days: daysArray
      });
    });

    return result.sort((a, b) => (a.tingkat || 0) - (b.tingkat || 0));
  }
};
