// src/components/modals/RoomModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Room } from '@/types/database.types';
import type { CreateRoomInput } from '@/services/roomService';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onSave: (data: CreateRoomInput) => Promise<void>;
}

const TIPE_RUANG_OPTIONS = [
  'Kelas Reguler',
  'Lab',
  'Aula',
  'Perpustakaan',
  'Olahraga',
  'Multimedia',
  'Komputer',
  'Bahasa',
  'Kimia',
  'Fisika',
  'Biologi',
];

export default function RoomModal({
  isOpen,
  onClose,
  room,
  onSave,
}: RoomModalProps) {
  const [formData, setFormData] = useState({
    nama_ruang: '',
    kapasitas: '',
    tipe_ruang: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (room) {
      setFormData({
        nama_ruang: room.nama_ruang,
        kapasitas: room.kapasitas.toString(),
        tipe_ruang: room.tipe_ruang,
      });
    } else {
      setFormData({
        nama_ruang: '',
        kapasitas: '',
        tipe_ruang: '',
      });
    }
    setErrors({});
  }, [room, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama_ruang.trim()) {
      newErrors.nama_ruang = 'Nama ruangan wajib diisi';
    }

    if (!formData.kapasitas) {
      newErrors.kapasitas = 'Kapasitas wajib diisi';
    } else if (parseInt(formData.kapasitas) < 1 || parseInt(formData.kapasitas) > 200) {
      newErrors.kapasitas = 'Kapasitas harus antara 1-200';
    }

    if (!formData.tipe_ruang) {
      newErrors.tipe_ruang = 'Tipe ruangan wajib dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSave({
        nama_ruang: formData.nama_ruang.trim(),
        kapasitas: parseInt(formData.kapasitas),
        tipe_ruang: formData.tipe_ruang,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {room ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Nama Ruangan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Ruangan <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.nama_ruang}
                  onChange={(e) => setFormData({ ...formData, nama_ruang: e.target.value })}
                  placeholder="Contoh: R.101, Lab Komputer 1"
                  className={errors.nama_ruang ? 'border-red-500' : ''}
                />
                {errors.nama_ruang && (
                  <p className="text-sm text-red-600 mt-1">{errors.nama_ruang}</p>
                )}
              </div>

              {/* Tipe Ruangan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Ruangan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipe_ruang}
                  onChange={(e) => setFormData({ ...formData, tipe_ruang: e.target.value })}
                  className={`w-full h-10 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.tipe_ruang ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih Tipe Ruangan</option>
                  {TIPE_RUANG_OPTIONS.map((tipe) => (
                    <option key={tipe} value={tipe}>
                      {tipe}
                    </option>
                  ))}
                </select>
                {errors.tipe_ruang && (
                  <p className="text-sm text-red-600 mt-1">{errors.tipe_ruang}</p>
                )}
              </div>

              {/* Kapasitas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kapasitas <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="200"
                  value={formData.kapasitas}
                  onChange={(e) => setFormData({ ...formData, kapasitas: e.target.value })}
                  placeholder="Contoh: 40"
                  className={errors.kapasitas ? 'border-red-500' : ''}
                />
                {errors.kapasitas && (
                  <p className="text-sm text-red-600 mt-1">{errors.kapasitas}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Jumlah maksimal siswa/peserta yang dapat ditampung
                </p>
              </div>

              {/* Preview */}
              {formData.nama_ruang && formData.tipe_ruang && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-xs font-medium text-indigo-900 mb-1">Preview:</p>
                  <p className="text-sm font-bold text-indigo-700">
                    {formData.nama_ruang} - {formData.tipe_ruang}
                  </p>
                  {formData.kapasitas && (
                    <p className="text-xs text-indigo-600 mt-1">
                      Kapasitas: {formData.kapasitas} orang
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}