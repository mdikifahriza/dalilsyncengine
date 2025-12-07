// src/hooks/useGARunner.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { gaService, CreateGARunInput } from '@/services/gaService';
import { scheduleService, CreateScheduleSlotInput } from '@/services/scheduleService';
import { useTeachers } from './useTeachers';
import { useClasses } from './useClasses';
import { useSubjects } from './useSubjects';
import { useRooms } from './useRooms';
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
  const { subjects } = useSubjects();
  const { rooms } = useRooms();

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<GAProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Run Genetic Algorithm with proper evolution
   */
  const runGA = useCallback(
    async (config: CreateGARunInput): Promise<GAResult | null> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (teachers.length === 0 || classes.length === 0 || subjects.length === 0 || rooms.length === 0) {
        throw new Error('Data tidak lengkap. Pastikan sudah ada guru, kelas, mata pelajaran, dan ruangan.');
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
        // Create GA run record in database
        gaRunRecord = await gaService.create(user.id, config);

        // Initialize Genetic Algorithm
        const ga = new GeneticAlgorithm(
          {
            maxGenerations: config.max_generations,
            populationSize: config.population_size,
            eliteSize: Math.max(2, Math.floor(config.population_size * 0.1)), // 10% elite
            mutationRate: 0.3, // 30% chance to mutate
            crossoverRate: 0.8, // 80% chance to crossover
          },
          teachers,
          classes,
          subjects,
          rooms
        );

        setProgress(prev => prev ? { ...prev, status: 'running' } : null);

        // Run evolution with progress callback
        const bestSchedule = await new Promise<Schedule>((resolve) => {
          // Run in next tick to allow UI update
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

        // Convert to database format
        const scheduleSlots: CreateScheduleSlotInput[] = bestSchedule.slots.map(slot => ({
          ga_run_id: gaRunRecord.id,
          ...slot,
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
    [user, teachers, classes, subjects, rooms]
  );

  return {
    runGA,
    isRunning,
    progress,
    error,
  };
}