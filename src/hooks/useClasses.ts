// src/hooks/useClasses.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { classService, CreateClassInput, UpdateClassInput } from '@/services/classService';
import type { ClassGroup } from '@/types/database.types';

export function useClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await classService.getAll(user.id);
      setClasses(data);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError(err.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const createClass = async (input: CreateClassInput) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newClass = await classService.create(user.id, input);
      setClasses(prev => [newClass, ...prev]);
      return newClass;
    } catch (err: any) {
      console.error('Error creating class:', err);
      throw new Error(err.message || 'Gagal menambahkan kelas');
    }
  };

  const updateClass = async (id: number, input: UpdateClassInput) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedClass = await classService.update(id, user.id, input);
      setClasses(prev => prev.map(c => c.id === id ? updatedClass : c));
      return updatedClass;
    } catch (err: any) {
      console.error('Error updating class:', err);
      throw new Error(err.message || 'Gagal mengupdate kelas');
    }
  };

  const deleteClass = async (id: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await classService.delete(id, user.id);
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Error deleting class:', err);
      throw new Error(err.message || 'Gagal menghapus kelas');
    }
  };

  return {
    classes,
    loading,
    error,
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
  };
}