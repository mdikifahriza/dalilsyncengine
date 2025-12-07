// src/hooks/useSubjects.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subjectService, CreateSubjectInput, UpdateSubjectInput } from '@/services/subjectService';
import type { Subject } from '@/types/database.types';

export function useSubjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await subjectService.getAll(user.id);
      setSubjects(data);
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      setError(err.message || 'Gagal memuat data mata pelajaran');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const createSubject = async (input: CreateSubjectInput) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newSubject = await subjectService.create(user.id, input);
      setSubjects(prev => [newSubject, ...prev]);
      return newSubject;
    } catch (err: any) {
      console.error('Error creating subject:', err);
      throw new Error(err.message || 'Gagal menambahkan mata pelajaran');
    }
  };

  const updateSubject = async (id: number, input: UpdateSubjectInput) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedSubject = await subjectService.update(id, user.id, input);
      setSubjects(prev => prev.map(s => s.id === id ? updatedSubject : s));
      return updatedSubject;
    } catch (err: any) {
      console.error('Error updating subject:', err);
      throw new Error(err.message || 'Gagal mengupdate mata pelajaran');
    }
  };

  const deleteSubject = async (id: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await subjectService.delete(id, user.id);
      setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      throw new Error(err.message || 'Gagal menghapus mata pelajaran');
    }
  };

  return {
    subjects,
    loading,
    error,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
  };
}