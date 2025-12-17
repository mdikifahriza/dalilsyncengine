// src/components/modals/TimeBlockModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { TimeBlock, CreateTimeBlockInput } from '@/types/database.types';
import { TIPE_BLOCK_OPTIONS, HARI_OPTIONS } from '@/types/database.types';

interface TimeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeBlock: TimeBlock | null;
  existingBlocks: TimeBlock[];
  onSave: (data: CreateTimeBlockInput) => Promise<void>;
}

export default function TimeBlockModal({
  isOpen,
  onClose,
  timeBlock,
  existingBlocks,
  onSave,
}: TimeBlockModalProps) {
  const [formData, setFormData] = useState<CreateTimeBlockInput>({
    nama_block: '',
    tipe_block: 'lesson',
    jam_mulai: '07:00',
    jam_selesai: '07:45',
    urutan: 1,
    hari_berlaku: undefined,
    warna: '#4F46E5',
    is_fixed: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (timeBlock) {
      setFormData({
        nama_block: timeBlock.nama_block,
        tipe_block: timeBlock.tipe_block,
        jam_mulai: timeBlock.jam_mulai.slice(0, 5),
        jam_selesai: timeBlock.jam_selesai.slice(0, 5),
        urutan: timeBlock.urutan,
        hari_berlaku: timeBlock.hari_berlaku || undefined,
        warna: timeBlock.warna,
        is_fixed: timeBlock.is_fixed,
      });
    } else {
      // Auto-calculate next urutan
      const maxUrutan = Math.max(0, ...existingBlocks.map((b) => b.urutan));
      setFormData({
        nama_block: '',
        tipe_block: 'lesson',
        jam_mulai: '07:00',
        jam_selesai: '07:45',
        urutan: maxUrutan + 1,
        hari_berlaku: undefined,
        warna: '#4F46E5',
        is_fixed: false,
      });
    }
    setErrors({});
  }, [timeBlock, isOpen, existingBlocks]);

  // Auto-set warna based on tipe_block
  useEffect(() => {
    const tipe = TIPE_BLOCK_OPTIONS.find((t) => t.value === formData.tipe_block);
    if (tipe && !timeBlock) {
      setFormData((prev) => ({ ...prev, warna: tipe.color }));
    }
  }, [formData.tipe_block, timeBlock]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama_block.trim()) {
      newErrors.nama_block = 'Nama blok wajib diisi';
    }

    if (formData.jam_mulai >= formData.jam_selesai) {
      newErrors.jam_selesai = 'Jam selesai harus lebih besar dari jam mulai';
    }

    // Check overlap with existing blocks (excluding current if editing)
    const blocksToCheck = timeBlock
      ? existingBlocks.filter((b) => b.id !== timeBlock.id)
      : existingBlocks;

    for (const block of blocksToCheck) {
      const blockStart = block.jam_mulai.slice(0, 5);
      const blockEnd = block.jam_selesai.slice(0, 5);

      if (
        (formData.jam_mulai < blockEnd && formData.jam_selesai > blockStart) ||
        (blockStart < formData.jam_selesai && blockEnd > formData.jam_mulai)
      ) {
        newErrors.jam_mulai = `Overlap dengan ${block.nama_block} (${blockStart}-${blockEnd})`;
        break;
      }
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
        ...formData,
        hari_berlaku: formData.hari_berlaku?.length ? formData.hari_berlaku : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleHari = (hari: string) => {
    const current = formData.hari_berlaku || [];
    if (current.includes(hari)) {
      setFormData({
        ...formData,
        hari_berlaku: current.filter((h) => h !== hari),
      });
    } else {
      setFormData({
        ...formData,
        hari_berlaku: [...current, hari],
      });
    }
  };

  const calculateDuration = () => {
    const [startH, startM] = formData.jam_mulai.split(':').map(Number);
    const [endH, endM] = formData.jam_selesai.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
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
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {timeBlock ? 'Edit Blok Waktu' : 'Tambah Blok Waktu'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nama Blok */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Blok <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.nama_block}
                    onChange={(e) => setFormData({ ...formData, nama_block: e.target.value })}
                    placeholder="Contoh: Jam 1, Istirahat, Sholat Dhuha"
                    className={errors.nama_block ? 'border-red-500' : ''}
                  />
                  {errors.nama_block && (
                    <p className="text-sm text-red-600 mt-1">{errors.nama_block}</p>
                  )}
                </div>

                {/* Tipe Blok */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Blok <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tipe_block}
                    onChange={(e: any) =>
                      setFormData({ ...formData, tipe_block: e.target.value })
                    }
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TIPE_BLOCK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Urutan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urutan <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.urutan}
                    onChange={(e) =>
                      setFormData({ ...formData, urutan: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">Urutan tampilan di jadwal</p>
                </div>

                {/* Jam Mulai */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Mulai <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    value={formData.jam_mulai}
                    onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                    className={errors.jam_mulai ? 'border-red-500' : ''}
                  />
                  {errors.jam_mulai && (
                    <p className="text-sm text-red-600 mt-1">{errors.jam_mulai}</p>
                  )}
                </div>

                {/* Jam Selesai */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Selesai <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    value={formData.jam_selesai}
                    onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                    className={errors.jam_selesai ? 'border-red-500' : ''}
                  />
                  {errors.jam_selesai && (
                    <p className="text-sm text-red-600 mt-1">{errors.jam_selesai}</p>
                  )}
                </div>

                {/* Warna */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.warna}
                      onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                      className="h-10 w-20 rounded border border-gray-300"
                    />
                    <Input
                      type="text"
                      value={formData.warna}
                      onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                      placeholder="#4F46E5"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Blok Tetap */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_fixed}
                      onChange={(e) => setFormData({ ...formData, is_fixed: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Blok Tetap (tidak bisa dijadwalkan)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Gunakan untuk istirahat, ibadah, atau kegiatan tetap lainnya
                  </p>
                </div>
              </div>

              {/* Hari Berlaku */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hari Berlaku (Opsional)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {HARI_OPTIONS.map((hari) => (
                    <label
                      key={hari}
                      className={`flex items-center justify-center p-2 border-2 rounded-lg cursor-pointer transition text-sm ${
                        formData.hari_berlaku?.includes(hari)
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.hari_berlaku?.includes(hari) || false}
                        onChange={() => toggleHari(hari)}
                        className="hidden"
                      />
                      {hari}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Kosongkan jika berlaku untuk semua hari
                </p>
              </div>

              {/* Preview */}
              <div
                className="p-4 rounded-lg border-2"
                style={{ borderLeftWidth: '6px', borderLeftColor: formData.warna }}
              >
                <p className="text-xs font-medium text-gray-500 mb-2">Preview:</p>
                <div className="flex items-center gap-4">
                  <div className="text-center" style={{ width: '80px' }}>
                    <p className="text-sm font-mono font-bold">{formData.jam_mulai}</p>
                    <p className="text-xs text-gray-500">{formData.jam_selesai}</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{formData.nama_block || '...'}</h3>
                    <p className="text-xs text-gray-600">
                      {calculateDuration()} menit
                      {formData.hari_berlaku && formData.hari_berlaku.length > 0 && (
                        <> • {formData.hari_berlaku.join(', ')}</>
                      )}
                      {formData.is_fixed && <> • Tetap</>}
                    </p>
                  </div>
                </div>
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