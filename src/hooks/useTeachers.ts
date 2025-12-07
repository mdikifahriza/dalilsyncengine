// src/hooks/useTeachers.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { teacherService, CreateTeacherInput, UpdateTeacherInput } from '@/services/teacherService';
import type { Teacher } from '@/types/database.types';

export function useTeachers() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await teacherService.getAll(user.id);
      setTeachers(data);
    } catch (err: any) {
      console.error('Error fetching teachers:', err);
      setError(err.message || 'Gagal memuat data guru');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const createTeacher = async (input: CreateTeacherInput) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newTeacher = await teacherService.create(user.id, input);
      setTeachers(prev => [newTeacher, ...prev]);
      return newTeacher;
    } catch (err: any) {
      console.error('Error creating teacher:', err);
      throw new Error(err.message || 'Gagal menambahkan guru');
    }
  };

  const updateTeacher = async (id: number, input: UpdateTeacherInput) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedTeacher = await teacherService.update(id, user.id, input);
      setTeachers(prev => prev.map(t => t.id === id ? updatedTeacher : t));
      return updatedTeacher;
    } catch (err: any) {
      console.error('Error updating teacher:', err);
      throw new Error(err.message || 'Gagal mengupdate guru');
    }
  };

  const deleteTeacher = async (id: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await teacherService.delete(id, user.id);
      setTeachers(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Error deleting teacher:', err);
      throw new Error(err.message || 'Gagal menghapus guru');
    }
  };

  return {
    teachers,
    loading,
    error,
    fetchTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher,
  };
}