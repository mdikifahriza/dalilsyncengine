// src/services/curriculumService.ts

import { supabase } from '@/lib/supabase';
import type {
  MapelKelas,
  MapelKelasWithRelations,
  CreateMapelKelasInput,
  UpdateMapelKelasInput,
} from '@/types/database.types';

export const curriculumService = {
  /**
   * Get curriculum for a specific class
   */
  async getByKelas(kelasId: number): Promise<MapelKelasWithRelations[]> {
    const { data, error } = await supabase
      .from('mapel_kelas')
      .select(`
        *,
        kelas:kelas_id(*),
        mapel:mapel_id(*),
        guru:guru_id(*)
      `)
      .eq('kelas_id', kelasId)
      .order('prioritas', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Get all curriculum for user
   */
  async getAll(userId: string): Promise<MapelKelasWithRelations[]> {
    const { data, error } = await supabase
      .from('mapel_kelas')
      .select(`
        *,
        kelas:kelas_id(*),
        mapel:mapel_id(*),
        guru:guru_id(*)
      `)
      .eq('user_id', userId)
      .order('kelas_id', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Assign subject to class
   */
  async assign(
    userId: string,
    input: CreateMapelKelasInput
  ): Promise<MapelKelas> {
    const { data, error } = await supabase
      .from('mapel_kelas')
      .insert({
        user_id: userId,
        ...input,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Bulk assign subjects to class
   */
  async bulkAssign(
    userId: string,
    kelasId: number,
    inputs: Omit<CreateMapelKelasInput, 'kelas_id'>[]
  ): Promise<MapelKelas[]> {
    const { data, error } = await supabase
      .from('mapel_kelas')
      .insert(
        inputs.map((input) => ({
          user_id: userId,
          kelas_id: kelasId,
          ...input,
        }))
      )
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  /**
   * Update curriculum entry
   */
  async update(
    id: number,
    userId: string,
    input: UpdateMapelKelasInput
  ): Promise<MapelKelas> {
    const { data, error } = await supabase
      .from('mapel_kelas')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Delete curriculum entry
   */
  async delete(id: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('mapel_kelas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Delete all curriculum for a class
   */
  async deleteByKelas(kelasId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('mapel_kelas')
      .delete()
      .eq('kelas_id', kelasId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Copy curriculum from one class to another
   */
  async copyFromKelas(
    userId: string,
    sourceKelasId: number,
    targetKelasId: number
  ): Promise<void> {
    // Get source curriculum
    const { data: sourceCurriculum, error: fetchError } = await supabase
      .from('mapel_kelas')
      .select('*')
      .eq('kelas_id', sourceKelasId)
      .eq('user_id', userId);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!sourceCurriculum || sourceCurriculum.length === 0) {
      throw new Error('Tidak ada kurikulum di kelas sumber');
    }

    // Insert to target class
    const { error: insertError } = await supabase
      .from('mapel_kelas')
      .insert(
        sourceCurriculum.map((item) => ({
          user_id: userId,
          kelas_id: targetKelasId,
          mapel_id: item.mapel_id,
          guru_id: item.guru_id,
          jumlah_jam_per_minggu: item.jumlah_jam_per_minggu,
          prioritas: item.prioritas,
          catatan: item.catatan,
        }))
      );

    if (insertError) {
      throw new Error(insertError.message);
    }
  },

  /**
   * Get summary statistics
   */
  async getStats(userId: string): Promise<{
    totalAssignments: number;
    totalHoursPerWeek: number;
    classesCovered: number;
    subjectsCovered: number;
  }> {
    const { data, error } = await supabase
      .from('mapel_kelas')
      .select('kelas_id, mapel_id, jumlah_jam_per_minggu')
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    const uniqueClasses = new Set(data.map((d) => d.kelas_id));
    const uniqueSubjects = new Set(data.map((d) => d.mapel_id));
    const totalHours = data.reduce((sum, d) => sum + d.jumlah_jam_per_minggu, 0);

    return {
      totalAssignments: data.length,
      totalHoursPerWeek: totalHours,
      classesCovered: uniqueClasses.size,
      subjectsCovered: uniqueSubjects.size,
    };
  },

  /**
   * Validate curriculum (check if all classes have subjects)
   */
  async validate(userId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get all classes
    const { data: classes, error: classError } = await supabase
      .from('kelas')
      .select('id, nama_kelas')
      .eq('user_id', userId);

    if (classError) {
      throw new Error(classError.message);
    }

    // Get all curriculum
    const { data: curriculum, error: currError } = await supabase
      .from('mapel_kelas')
      .select('kelas_id, mapel_id, jumlah_jam_per_minggu, guru_id')
      .eq('user_id', userId);

    if (currError) {
      throw new Error(currError.message);
    }

    // Check each class
    for (const kelas of classes || []) {
      const kelasSubjects = curriculum?.filter((c) => c.kelas_id === kelas.id) || [];

      if (kelasSubjects.length === 0) {
        errors.push(`Kelas ${kelas.nama_kelas} belum memiliki mata pelajaran`);
      } else {
        // Check if all subjects have teachers
        const missingTeachers = kelasSubjects.filter((s) => !s.guru_id);
        if (missingTeachers.length > 0) {
          warnings.push(
            `Kelas ${kelas.nama_kelas} memiliki ${missingTeachers.length} mata pelajaran tanpa guru`
          );
        }

        // Check total hours per week
        const totalHours = kelasSubjects.reduce((sum, s) => sum + s.jumlah_jam_per_minggu, 0);
        if (totalHours > 50) {
          warnings.push(
            `Kelas ${kelas.nama_kelas} memiliki ${totalHours} jam per minggu (terlalu banyak)`
          );
        } else if (totalHours < 20) {
          warnings.push(
            `Kelas ${kelas.nama_kelas} hanya memiliki ${totalHours} jam per minggu (mungkin kurang)`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },
};