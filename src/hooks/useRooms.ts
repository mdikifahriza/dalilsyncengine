// src/hooks/useRooms.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { roomService, CreateRoomInput, UpdateRoomInput } from '@/services/roomService';
import type { Room } from '@/types/database.types';

export function useRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await roomService.getAll(user.id);
      setRooms(data);
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      setError(err.message || 'Gagal memuat data ruangan');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const createRoom = async (input: CreateRoomInput) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newRoom = await roomService.create(user.id, input);
      setRooms(prev => [newRoom, ...prev]);
      return newRoom;
    } catch (err: any) {
      console.error('Error creating room:', err);
      throw new Error(err.message || 'Gagal menambahkan ruangan');
    }
  };

  const updateRoom = async (id: number, input: UpdateRoomInput) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedRoom = await roomService.update(id, user.id, input);
      setRooms(prev => prev.map(r => r.id === id ? updatedRoom : r));
      return updatedRoom;
    } catch (err: any) {
      console.error('Error updating room:', err);
      throw new Error(err.message || 'Gagal mengupdate ruangan');
    }
  };

  const deleteRoom = async (id: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await roomService.delete(id, user.id);
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      console.error('Error deleting room:', err);
      throw new Error(err.message || 'Gagal menghapus ruangan');
    }
  };

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
  };
}