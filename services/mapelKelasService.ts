// src/services/mapelKelasService.ts
import { supabase } from '@/lib/supabase';
import type { MapelKelasWithRelations } from '@/types/database.types';

export const mapelKelasService = {
  /**
   * Get mapel_kelas by ID with relations
   */
  async getById(id: number): Promise<MapelKelasWithRelations | null> {
    const { data, error } = await supabase
      .from('mapel_kelas')
      .select(`
        *,
        mapel:mapel_id (id, nama_mapel),
        guru:guru_id (id, nama),
        kelas:kelas_id (id, nama_kelas)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching mapel_kelas:', error);
      return null;
    }

    return data as any;
  },

  /**
   * Get multiple mapel_kelas by IDs
   */
  async getByIds(ids: number[]): Promise<Map<number, MapelKelasWithRelations>> {
    if (ids.length === 0) return new Map();

    const { data, error } = await supabase
      .from('mapel_kelas')
      .select(`
        *,
        mapel:mapel_id (id, nama_mapel),
        guru:guru_id (id, nama),
        kelas:kelas_id (id, nama_kelas)
      `)
      .in('id', ids);

    if (error) {
      console.error('Error fetching mapel_kelas batch:', error);
      return new Map();
    }

    const map = new Map<number, MapelKelasWithRelations>();
    (data as any[])?.forEach(item => {
      map.set(item.id, item);
    });

    return map;
  }
};
