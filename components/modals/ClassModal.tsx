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

export default function ClassModal({
  isOpen,
  onClose,
  classData,
  onSave,
}: ClassModalProps) {
  const [formData, setFormData] = useState({
    nama_kelas: '',
    tingkat: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (classData) {
      setFormData({
        nama_kelas: classData.nama_kelas,
        tingkat: classData.tingkat?.toString() || '',
      });
    } else {
      setFormData({
        nama_kelas: '',
        tingkat: '',
      });
    }
    setErrors({});
  }, [classData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama_kelas.trim()) {
      newErrors.nama_kelas = 'Nama kelas wajib diisi';
    }

    if (!formData.tingkat.trim()) {
      newErrors.tingkat = 'Tingkat wajib diisi';
    } else if (parseInt(formData.tingkat) < 1 || parseInt(formData.tingkat) > 12) {
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
        tingkat: parseInt(formData.tingkat),
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
              </div>

              {/* Tingkat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat <span className="text-red-500">*</span>
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