// src/services/gaService.ts - SIMPLIFIED (no manual config)
import { supabase } from '@/lib/supabase';
import type { GARun } from '@/types/database.types';

export const gaService = {
  async create(userId: string): Promise<GARun> {
    const { data, error } = await supabase
      .from('ga_run')
      .insert({
        user_id: userId,
        timestamp_start: new Date().toISOString(),
        max_generations: 500,
        population_size: 50,
        status: 'running',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async complete(id: number, finalFitness: number, generationCount: number): Promise<GARun> {
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

  async getAll(userId: string): Promise<GARun[]> {
    const { data, error } = await supabase
      .from('ga_run')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp_start', { ascending: false });

    if (error) throw error;
    return data || [];
  },

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

  async delete(id: number, userId: string): Promise<void> {
    await supabase.from('jadwal_slot').delete().eq('ga_run_id', id);
    
    const { error } = await supabase
      .from('ga_run')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },
};