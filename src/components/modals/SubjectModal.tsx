// src/components/modals/SubjectModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Subject } from '@/types/database.types';
import type { CreateSubjectInput } from '@/services/subjectService';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  onSave: (data: CreateSubjectInput) => Promise<void>;
}

export default function SubjectModal({
  isOpen,
  onClose,
  subject,
  onSave,
}: SubjectModalProps) {
  const [formData, setFormData] = useState({
    nama_mapel: '',
    jumlah_jam_per_minggu: '',
    ruang_khusus: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (subject) {
      setFormData({
        nama_mapel: subject.nama_mapel,
        jumlah_jam_per_minggu: subject.jumlah_jam_per_minggu.toString(),
        ruang_khusus: subject.ruang_khusus || '',
      });
    } else {
      setFormData({
        nama_mapel: '',
        jumlah_jam_per_minggu: '',
        ruang_khusus: '',
      });
    }
    setErrors({});
  }, [subject, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama_mapel.trim()) {
      newErrors.nama_mapel = 'Nama mata pelajaran wajib diisi';
    }

    if (!formData.jumlah_jam_per_minggu) {
      newErrors.jumlah_jam_per_minggu = 'Jumlah jam wajib diisi';
    } else if (parseInt(formData.jumlah_jam_per_minggu) < 1 || parseInt(formData.jumlah_jam_per_minggu) > 10) {
      newErrors.jumlah_jam_per_minggu = 'Jumlah jam harus antara 1-10';
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
        nama_mapel: formData.nama_mapel.trim(),
        jumlah_jam_per_minggu: parseInt(formData.jumlah_jam_per_minggu),
        ruang_khusus: formData.ruang_khusus || undefined,
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
                {subject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
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
              {/* Nama Mata Pelajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.nama_mapel}
                  onChange={(e) => setFormData({ ...formData, nama_mapel: e.target.value })}
                  placeholder="Contoh: Matematika"
                  className={errors.nama_mapel ? 'border-red-500' : ''}
                />
                {errors.nama_mapel && (
                  <p className="text-sm text-red-600 mt-1">{errors.nama_mapel}</p>
                )}
              </div>

              {/* Jumlah Jam per Minggu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Jam per Minggu <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.jumlah_jam_per_minggu}
                  onChange={(e) =>
                    setFormData({ ...formData, jumlah_jam_per_minggu: e.target.value })
                  }
                  placeholder="Contoh: 4"
                  className={errors.jumlah_jam_per_minggu ? 'border-red-500' : ''}
                />
                {errors.jumlah_jam_per_minggu && (
                  <p className="text-sm text-red-600 mt-1">{errors.jumlah_jam_per_minggu}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Total jam pelajaran dalam seminggu
                </p>
              </div>

              {/* Ruang Khusus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruang Khusus (Opsional)
                </label>
                <Input
                  type="text"
                  value={formData.ruang_khusus}
                  onChange={(e) => setFormData({ ...formData, ruang_khusus: e.target.value })}
                  placeholder="Contoh: Lab Komputer, Lab Fisika"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nama ruangan khusus jika mata pelajaran memerlukan
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