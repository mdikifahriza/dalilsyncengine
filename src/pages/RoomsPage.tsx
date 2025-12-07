// src/pages/RoomsPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, DoorOpen, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useRooms } from '@/hooks/useRooms';
import RoomModal from '@/components/modals/RoomModal';
import type { Room } from '@/types/database.types';

export default function RoomsPage() {
  const { rooms, loading, error, createRoom, updateRoom, deleteRoom } = useRooms();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const filteredRooms = rooms.filter(room =>
    room.nama_ruang.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.tipe_ruang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRoom(id);
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getRoomTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Kelas Reguler': 'bg-blue-100 text-blue-800',
      'Lab': 'bg-purple-100 text-purple-800',
      'Aula': 'bg-green-100 text-green-800',
      'Perpustakaan': 'bg-amber-100 text-amber-800',
      'Olahraga': 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data ruangan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DoorOpen className="w-8 h-8 text-indigo-600" />
            Data Ruangan
          </h1>
          <p className="text-gray-500 mt-1">Kelola data ruangan dan fasilitas</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tambah Ruangan
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Cari ruangan berdasarkan nama atau tipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rooms List */}
      {filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DoorOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Tidak ada hasil' : 'Belum ada data ruangan'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? 'Coba kata kunci pencarian lain'
                : 'Mulai dengan menambahkan ruangan pertama Anda'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="w-5 h-5 mr-2" />
                Tambah Ruangan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <DoorOpen className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <span className="text-lg font-bold text-gray-900 truncate">
                        {room.nama_ruang}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(room)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(room.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getRoomTypeColor(
                        room.tipe_ruang
                      )}`}
                    >
                      {room.tipe_ruang}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Kapasitas:</span>
                    </div>
                    <span className="font-bold text-indigo-600 text-lg">
                      {room.kapasitas}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Ditambahkan: {new Date(room.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredRooms.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{rooms.length}</p>
                <p className="text-sm text-gray-600">Total Ruangan</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {rooms.reduce((sum, r) => sum + r.kapasitas, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Kapasitas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {rooms.filter(r => r.tipe_ruang === 'Kelas Reguler').length}
                </p>
                <p className="text-sm text-gray-600">Kelas Reguler</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {rooms.filter(r => r.tipe_ruang === 'Lab').length}
                </p>
                <p className="text-sm text-gray-600">Laboratorium</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus ruangan ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>
                Hapus
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Room Modal */}
      <RoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        room={editingRoom}
        onSave={async (data) => {
          try {
            if (editingRoom) {
              await updateRoom(editingRoom.id, data);
            } else {
              await createRoom(data);
            }
            setIsModalOpen(false);
          } catch (err: any) {
            alert(err.message);
          }
        }}
      />
    </div>
  );
}