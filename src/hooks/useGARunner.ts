// src/hooks/useGARunner.ts - UPDATED: Remove rooms, add timeBlocksKelas
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { gaService, CreateGARunInput } from '@/services/gaService';
import { scheduleService, CreateScheduleSlotInput } from '@/services/scheduleService';
import { timeBlockService } from '@/services/timeBlockService';
import { timeBlockKelasService } from '@/services/timeBlockKelasService'; // ✅ NEW
import { curriculumService } from '@/services/curriculumService';
import { useTeachers } from './useTeachers';
import { useClasses } from './useClasses';
// ❌ REMOVED: import { useRooms } from './useRooms';
import { GeneticAlgorithm, type Schedule } from '@/lib/geneticAlgorithm';
import type { GARun } from '@/types/database.types';

export interface GAProgress {
  generation: number;
  maxGenerations: number;
  fitness: number;
  status: 'initializing' | 'running' | 'completed' | 'failed';
}

export interface GAResult {
  gaRun: GARun;
  schedule: CreateScheduleSlotInput[];
  conflicts: string[];
  fitness: number;
}

export function useGARunner() {
  const { user } = useAuth();
  const { teachers } = useTeachers();
  const { classes } = useClasses();
  // ❌ REMOVED: const { rooms } = useRooms();

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<GAProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Run Genetic Algorithm with Time Blocks & Curriculum
   */
  const runGA = useCallback(
    async (config: CreateGARunInput): Promise<GAResult | null> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // ✅ UPDATED: Validation (removed rooms)
      if (teachers.length === 0 || classes.length === 0) {
        throw new Error('Data tidak lengkap. Pastikan sudah ada guru dan kelas.');
      }

      setIsRunning(true);
      setError(null);
      setProgress({
        generation: 0,
        maxGenerations: config.max_generations,
        fitness: 0,
        status: 'initializing',
      });

      let gaRunRecord: GARun | null = null;

      try {
        // ✅ UPDATED: Load time blocks, timeBlocksKelas, & curriculum
        const [timeBlocks, curriculum] = await Promise.all([
          timeBlockService.getAll(user.id),
          curriculumService.getAll(user.id),
        ]);

        // ✅ NEW: Load time blocks assignments for all classes
        const timeBlocksKelasArrays = await Promise.all(
          classes.map(kelas => timeBlockKelasService.getByKelas(kelas.id))
        );
        const timeBlocksKelas = timeBlocksKelasArrays.flat();

        // Validation
        if (timeBlocks.length === 0) {
          throw new Error('Tidak ada blok waktu. Silakan atur blok waktu terlebih dahulu.');
        }

        if (timeBlocksKelas.length === 0) {
          throw new Error('Belum ada time blocks yang di-assign ke kelas. Silakan assign time blocks di halaman Blok Waktu.');
        }

        if (curriculum.length === 0) {
          throw new Error('Tidak ada kurikulum yang diatur. Silakan atur kurikulum kelas terlebih dahulu.');
        }

        // Validate curriculum has teachers assigned
        const curriculumWithoutTeacher = curriculum.filter(c => !c.guru_id);
        if (curriculumWithoutTeacher.length > 0) {
          throw new Error(`Ada ${curriculumWithoutTeacher.length} mata pelajaran yang belum ditugaskan guru.`);
        }

        // Create GA run record in database
        gaRunRecord = await gaService.create(user.id, config);

        // ✅ UPDATED: Initialize GA without rooms, with timeBlocksKelas
        const ga = new GeneticAlgorithm(
          {
            maxGenerations: config.max_generations,
            populationSize: config.population_size,
            eliteSize: Math.max(2, Math.floor(config.population_size * 0.1)),
            mutationRate: 0.3,
            crossoverRate: 0.8,
          },
          teachers,
          classes,
          // ❌ REMOVED: rooms,
          timeBlocks,
          timeBlocksKelas, // ✅ NEW
          curriculum
        );

        // ✅ NEW: Validate before running
        const validation = ga.validate();
        if (!validation.valid) {
          throw new Error(`Validasi gagal: ${validation.errors.join(', ')}`);
        }

        setProgress(prev => prev ? { ...prev, status: 'running' } : null);

        // Run evolution with progress callback
        const bestSchedule = await new Promise<Schedule>((resolve) => {
          setTimeout(() => {
            const result = ga.evolve((gen, best) => {
              setProgress({
                generation: gen,
                maxGenerations: config.max_generations,
                fitness: best.fitness,
                status: 'running',
              });
            });
            resolve(result);
          }, 100);
        });

        // ✅ UPDATED: Convert to database format (removed ruang_id)
        const scheduleSlots: CreateScheduleSlotInput[] = bestSchedule.slots.map(slot => ({
          ga_run_id: gaRunRecord.id,
          kelas_id: slot.kelas_id,
          guru_id: slot.guru_id,
          mapel_id: slot.mapel_id,
          // ❌ REMOVED: ruang_id: slot.ruang_id,
          hari: slot.hari,
          time_block_id: slot.time_block_id,
          jam_ke: slot.jam_ke,
        }));

        // Save schedule to database
        await scheduleService.saveBulk(scheduleSlots);

        // Complete GA run
        await gaService.complete(
          gaRunRecord.id,
          bestSchedule.fitness,
          config.max_generations
        );

        setProgress(prev => prev ? { ...prev, status: 'completed' } : null);

        return {
          gaRun: {
            ...gaRunRecord,
            final_fitness: bestSchedule.fitness,
            generation_count: config.max_generations,
            status: 'completed',
          },
          schedule: scheduleSlots,
          conflicts: bestSchedule.conflicts,
          fitness: bestSchedule.fitness,
        };
      } catch (err: any) {
        console.error('GA error:', err);
        setError(err.message || 'Terjadi kesalahan saat generate jadwal');
        setProgress(prev => prev ? { ...prev, status: 'failed' } : null);

        // Mark GA run as failed
        if (gaRunRecord) {
          await gaService.fail(gaRunRecord.id);
        }

        return null;
      } finally {
        setIsRunning(false);
      }
    },
    [user, teachers, classes] // ❌ REMOVED: rooms from dependencies
  );

  return {
    runGA,
    isRunning,
    progress,
    error,
  };
}