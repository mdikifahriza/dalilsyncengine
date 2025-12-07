// src/components/modals/ClassModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ClassGroup } from '@/types/database.types';
import type { CreateClassInput } from '@/services/classService';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassGroup | null;
  onSave: (data: CreateClassInput) => Promise<void>;
}

const JURUSAN_OPTIONS = [
  'IPA',
  'IPS',
  'Bahasa',
  'Agama',
  'Teknik Komputer dan Jaringan',
  'Rekayasa Perangkat Lunak',
  'Multimedia',
  'Akuntansi',
  'Administrasi Perkantoran',
  'Pemasaran',
];

export default function ClassModal({
  isOpen,
  onClose,
  classData,
  onSave,
}: ClassModalProps) {
  const [formData, setFormData] = useState({
    nama_kelas: '',
    tingkat: '',
    jurusan: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (classData) {
      setFormData({
        nama_kelas: classData.nama_kelas,
        tingkat: classData.tingkat?.toString() || '',
        jurusan: classData.jurusan || '',
      });
    } else {
      setFormData({
        nama_kelas: '',
        tingkat: '',
        jurusan: '',
      });
    }
    setErrors({});
  }, [classData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama_kelas.trim()) {
      newErrors.nama_kelas = 'Nama kelas wajib diisi';
    }

    if (formData.tingkat && (parseInt(formData.tingkat) < 1 || parseInt(formData.tingkat) > 12)) {
      newErrors.tingkat = 'Tingkat harus antara 1-12';
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
        nama_kelas: formData.nama_kelas.trim(),
        tingkat: formData.tingkat ? parseInt(formData.tingkat) : undefined,
        jurusan: formData.jurusan || undefined,
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
                {classData ? 'Edit Kelas' : 'Tambah Kelas Baru'}
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
              {/* Nama Kelas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Kelas <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.nama_kelas}
                  onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                  placeholder="Contoh: X IPA 1, XI RPL 2, XII AKL 1"
                  className={errors.nama_kelas ? 'border-red-500' : ''}
                />
                {errors.nama_kelas && (
                  <p className="text-sm text-red-600 mt-1">{errors.nama_kelas}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Nama lengkap kelas (tingkat, jurusan, dan nomor)
                </p>
              </div>

              {/* Tingkat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat (Opsional)
                </label>
                <Input
                  type="number"
                  value={formData.tingkat}
                  onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                  placeholder="Contoh: 10, 11, 12"
                  min="1"
                  max="12"
                  className={errors.tingkat ? 'border-red-500' : ''}
                />
                {errors.tingkat && (
                  <p className="text-sm text-red-600 mt-1">{errors.tingkat}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Tingkat kelas (1-12)
                </p>
              </div>

              {/* Jurusan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jurusan (Opsional)
                </label>
                <select
                  value={formData.jurusan}
                  onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Pilih Jurusan</option>
                  {JURUSAN_OPTIONS.map((jurusan) => (
                    <option key={jurusan} value={jurusan}>
                      {jurusan}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Pilih jurusan kelas (IPA, IPS, atau jurusan SMK)
                </p>
              </div>

              {/* Custom Jurusan Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atau Tulis Jurusan Lain
                </label>
                <Input
                  type="text"
                  value={formData.jurusan && !JURUSAN_OPTIONS.includes(formData.jurusan) ? formData.jurusan : ''}
                  onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                  placeholder="Contoh: Teknik Otomotif"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Jika jurusan tidak ada di daftar, tulis manual di sini
                </p>
              </div>

              {/* Preview */}
              {formData.nama_kelas && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-indigo-900 mb-1">Preview:</p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-semibold text-indigo-700">Nama:</span>{' '}
                      {formData.nama_kelas}
                    </p>
                    {formData.tingkat && (
                      <p className="text-sm">
                        <span className="font-semibold text-indigo-700">Tingkat:</span>{' '}
                        Kelas {formData.tingkat}
                      </p>
                    )}
                    {formData.jurusan && (
                      <p className="text-sm">
                        <span className="font-semibold text-indigo-700">Jurusan:</span>{' '}
                        {formData.jurusan}
                      </p>
                    )}
                  </div>
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
