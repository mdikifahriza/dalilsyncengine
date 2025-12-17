// src/components/modals/CurriculumModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { MapelKelasWithRelations, Subject, Teacher } from '@/types/database.types';
import { PRIORITAS_OPTIONS } from '@/types/database.types';

interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculumItem: MapelKelasWithRelations | null;
  subjects: Subject[];
  teachers: Teacher[];
  onSave: (data: any) => Promise<void>;
}

export default function CurriculumModal({
  isOpen,
  onClose,
  curriculumItem,
  subjects,
  teachers,
  onSave,
}: CurriculumModalProps) {
  const [formData, setFormData] = useState({
    mapel_id: '',
    guru_id: '',
    jumlah_jam_per_minggu: '',
    prioritas: 1,
    catatan: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (curriculumItem) {
      setFormData({
        mapel_id: curriculumItem.mapel_id.toString(),
        guru_id: curriculumItem.guru_id?.toString() || '',
        jumlah_jam_per_minggu: curriculumItem.jumlah_jam_per_minggu.toString(),
        prioritas: curriculumItem.prioritas,
        catatan: curriculumItem.catatan || '',
      });
    } else {
      setFormData({
        mapel_id: '',
        guru_id: '',
        jumlah_jam_per_minggu: '',
        prioritas: 1,
        catatan: '',
      });
    }
    setErrors({});
  }, [curriculumItem, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.mapel_id) {
      newErrors.mapel_id = 'Mata pelajaran wajib dipilih';
    }

    if (!formData.jumlah_jam_per_minggu) {
      newErrors.jumlah_jam_per_minggu = 'Jumlah jam wajib diisi';
    } else if (
      parseInt(formData.jumlah_jam_per_minggu) < 1 ||
      parseInt(formData.jumlah_jam_per_minggu) > 20
    ) {
      newErrors.jumlah_jam_per_minggu = 'Jumlah jam harus antara 1-20';
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
        mapel_id: parseInt(formData.mapel_id),
        guru_id: formData.guru_id ? parseInt(formData.guru_id) : undefined,
        jumlah_jam_per_minggu: parseInt(formData.jumlah_jam_per_minggu),
        prioritas: formData.prioritas,
        catatan: formData.catatan || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter teachers by selected subject
  const filteredTeachers = formData.mapel_id
    ? teachers.filter((t) => t.mapel_id === parseInt(formData.mapel_id))
    : teachers;

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
                {curriculumItem ? 'Edit Kurikulum' : 'Tambah ke Kurikulum'}
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
              {/* Mata Pelajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.mapel_id}
                  onChange={(e) => {
                    setFormData({ ...formData, mapel_id: e.target.value, guru_id: '' });
                  }}
                  className={`w-full h-10 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.mapel_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={!!curriculumItem} // Can't change mapel when editing
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

              {/* Guru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guru Pengajar
                </label>
                <select
                  value={formData.guru_id}
                  onChange={(e) => setFormData({ ...formData, guru_id: e.target.value })}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={!formData.mapel_id}
                >
                  <option value="">Pilih Guru</option>
                  {filteredTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.nama}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {!formData.mapel_id
                    ? 'Pilih mata pelajaran terlebih dahulu'
                    : filteredTeachers.length === 0
                    ? 'Tidak ada guru untuk mata pelajaran ini'
                    : 'Guru yang mengajar mata pelajaran ini'}
                </p>
              </div>

              {/* Jumlah Jam per Minggu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Jam per Minggu <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
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
                  Total jam pelajaran dalam seminggu (1-20)
                </p>
              </div>

              {/* Prioritas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioritas</label>
                <select
                  value={formData.prioritas}
                  onChange={(e) =>
                    setFormData({ ...formData, prioritas: parseInt(e.target.value) as any })
                  }
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PRIORITAS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Catatan tambahan untuk kurikulum ini"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Preview */}
              {formData.mapel_id && formData.jumlah_jam_per_minggu && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-xs font-medium text-indigo-900 mb-2">Preview:</p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Mapel:</strong>{' '}
                      {subjects.find((s) => s.id === parseInt(formData.mapel_id))?.nama_mapel}
                    </p>
                    {formData.guru_id && (
                      <p>
                        <strong>Guru:</strong>{' '}
                        {teachers.find((t) => t.id === parseInt(formData.guru_id))?.nama}
                      </p>
                    )}
                    <p>
                      <strong>Jam per Minggu:</strong> {formData.jumlah_jam_per_minggu} jam
                    </p>
                    <p>
                      <strong>Prioritas:</strong>{' '}
                      {PRIORITAS_OPTIONS.find((p) => p.value === formData.prioritas)?.label}
                    </p>
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