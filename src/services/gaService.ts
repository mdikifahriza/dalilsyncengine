// src/services/gaService.ts
import { supabase } from '@/lib/supabase';
import type { GARun } from '@/types/database.types';

export interface CreateGARunInput {
  max_generations: number;
  population_size: number;
}

export interface UpdateGARunInput {
  timestamp_end?: string;
  final_fitness?: number;
  generation_count?: number;
  status: 'running' | 'completed' | 'failed';
}

export interface GARunWithStats extends GARun {
  slot_count?: number;
  conflict_count?: number;
}

export const gaService = {
  /**
   * Create new GA run
   */
  async create(userId: string, input: CreateGARunInput): Promise<GARun> {
    const { data, error } = await supabase
      .from('ga_run')
      .insert({
        user_id: userId,
        timestamp_start: new Date().toISOString(),
        max_generations: input.max_generations,
        population_size: input.population_size,
        status: 'running',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update GA run progress
   */
  async update(id: number, input: UpdateGARunInput): Promise<GARun> {
    const { data, error } = await supabase
      .from('ga_run')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Complete GA run
   */
  async complete(
    id: number,
    finalFitness: number,
    generationCount: number
  ): Promise<GARun> {
    const { data, error } = await supabase
      .from('ga_run')
      .update({
        timestamp_end: new Date().toISOString(),
        final_fitness: finalFitness,
        generation_count: generationCount,
        status: 'completed',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark GA run as failed
   */
  async fail(id: number): Promise<GARun> {
    const { data, error } = await supabase
      .from('ga_run')
      .update({
        timestamp_end: new Date().toISOString(),
        status: 'failed',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all GA runs for user (with stats)
   */
  async getAllWithStats(userId: string): Promise<GARunWithStats[]> {
    // Get runs
    const { data: runs, error: runsError } = await supabase
      .from('ga_run')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp_start', { ascending: false });

    if (runsError) throw runsError;
    if (!runs) return [];

    // Get slot counts for each run
    const runsWithStats = await Promise.all(
      runs.map(async (run) => {
        const { count } = await supabase
          .from('jadwal_slot')
          .select('*', { count: 'exact', head: true })
          .eq('ga_run_id', run.id);

        return {
          ...run,
          slot_count: count || 0,
        };
      })
    );

    return runsWithStats;
  },

  /**
   * Get all GA runs for user (simple)
   */
  async getAll(userId: string): Promise<GARun[]> {
    const { data, error } = await supabase
      .from('ga_run')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp_start', { ascending: false});

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single GA run by ID
   */
  async getById(id: number, userId: string): Promise<GARun | null> {
    const { data, error } = await supabase
      .from('ga_run')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get latest successful GA run
   */
  async getLatestSuccessful(userId: string): Promise<GARun | null> {
    const { data, error } = await supabase
      .from('ga_run')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('timestamp_start', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  /**
   * Delete GA run and associated schedule
   */
  async delete(id: number, userId: string): Promise<void> {
    // First delete associated schedule slots
    await supabase
      .from('jadwal_slot')
      .delete()
      .eq('ga_run_id', id);

    // Then delete the GA run
    const { error } = await supabase
      .from('ga_run')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },
};