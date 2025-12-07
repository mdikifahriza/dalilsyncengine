// src/components/modals/TeacherModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Teacher, Subject } from '@/types/database.types';
import type { CreateTeacherInput } from '@/services/teacherService';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  subjects: Subject[];
  onSave: (data: CreateTeacherInput) => Promise<void>;
}

const HARI_OPTIONS = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export default function TeacherModal({
  isOpen,
  onClose,
  teacher,
  subjects,
  onSave,
}: TeacherModalProps) {
  const [formData, setFormData] = useState({
    nama: '',
    mapel_id: '',
    jam_maks: '',
    hari_tidak_bisa: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (teacher) {
      setFormData({
        nama: teacher.nama,
        mapel_id: teacher.mapel_id.toString(),
        jam_maks: teacher.jam_maks.toString(),
        hari_tidak_bisa: teacher.hari_tidak_bisa || '',
      });
    } else {
      setFormData({
        nama: '',
        mapel_id: '',
        jam_maks: '',
        hari_tidak_bisa: '',
      });
    }
    setErrors({});
  }, [teacher, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama guru wajib diisi';
    }

    if (!formData.mapel_id) {
      newErrors.mapel_id = 'Mata pelajaran wajib dipilih';
    }

    if (!formData.jam_maks) {
      newErrors.jam_maks = 'Jam maksimal wajib diisi';
    } else if (parseInt(formData.jam_maks) < 1 || parseInt(formData.jam_maks) > 40) {
      newErrors.jam_maks = 'Jam maksimal harus antara 1-40';
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
        nama: formData.nama.trim(),
        mapel_id: parseInt(formData.mapel_id),
        jam_maks: parseInt(formData.jam_maks),
        hari_tidak_bisa: formData.hari_tidak_bisa || undefined,
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
                {teacher ? 'Edit Guru' : 'Tambah Guru Baru'}
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
              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Guru <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className={errors.nama ? 'border-red-500' : ''}
                />
                {errors.nama && (
                  <p className="text-sm text-red-600 mt-1">{errors.nama}</p>
                )}
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.mapel_id}
                  onChange={(e) => setFormData({ ...formData, mapel_id: e.target.value })}
                  className={`w-full h-10 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.mapel_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.nama_mapel}
                    </option>
                  ))}
                </select>
                {errors.mapel_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.mapel_id}</p>
                )}
              </div>

              {/* Jam Maksimal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Maksimal per Minggu <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="40"
                  value={formData.jam_maks}
                  onChange={(e) => setFormData({ ...formData, jam_maks: e.target.value })}
                  placeholder="Contoh: 24"
                  className={errors.jam_maks ? 'border-red-500' : ''}
                />
                {errors.jam_maks && (
                  <p className="text-sm text-red-600 mt-1">{errors.jam_maks}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal jam mengajar dalam seminggu
                </p>
              </div>

              {/* Hari Tidak Bisa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hari Tidak Bisa Mengajar (Opsional)
                </label>
                <select
                  value={formData.hari_tidak_bisa}
                  onChange={(e) =>
                    setFormData({ ...formData, hari_tidak_bisa: e.target.value })
                  }
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tidak ada</option>
                  {HARI_OPTIONS.map((hari) => (
                    <option key={hari} value={hari}>
                      {hari}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Pilih hari dimana guru tidak tersedia mengajar
                </p>
              </div>

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