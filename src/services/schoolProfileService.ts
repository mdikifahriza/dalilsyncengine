// src/services/schoolProfileService.ts

import { supabase } from '@/lib/supabase';
import type {
  SchoolProfile,
  CreateSchoolProfileInput,
  UpdateSchoolProfileInput,
} from '@/types/database.types';

export const schoolProfileService = {
  /**
   * Get school profile for current user
   */
  async get(userId: string): Promise<SchoolProfile | null> {
    const { data, error } = await supabase
      .from('school_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Create school profile
   */
  async create(
    userId: string,
    input: CreateSchoolProfileInput
  ): Promise<SchoolProfile> {
    const { data, error } = await supabase
      .from('school_profile')
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
   * Update school profile
   */
  async update(
    userId: string,
    input: UpdateSchoolProfileInput
  ): Promise<SchoolProfile> {
    const { data, error } = await supabase
      .from('school_profile')
      .update(input)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Delete school profile
   */
  async delete(userId: string): Promise<void> {
    const { error } = await supabase
      .from('school_profile')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Check if user has completed school setup
   */
  async hasCompletedSetup(userId: string): Promise<boolean> {
    const profile = await this.get(userId);
    return profile !== null;
  },
};