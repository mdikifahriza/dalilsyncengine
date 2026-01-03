// src/components/modals/CopyClassModal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ClassGroup } from '@/types/database.types';

interface CopyClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKelasId: number;
  availableClasses: ClassGroup[];
  onCopy: (sourceKelasId: number) => Promise<void>;
}

export default function CopyClassModal({
  isOpen,
  onClose,
  currentKelasId,
  availableClasses,
  onCopy,
}: CopyClassModalProps) {
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out current class
  const otherClasses = availableClasses.filter((k) => k.id !== currentKelasId);

  const handleCopy = async () => {
    if (!selectedKelasId) {
      setError('Pilih kelas sumber terlebih dahulu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onCopy(parseInt(selectedKelasId));
      onClose();
      setSelectedKelasId('');
    } catch (err: any) {
      setError(err.message || 'Gagal menyalin kurikulum');
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
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md"
          >
            {/* Header */}
            <div className="border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Copy Kurikulum dari Kelas Lain
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {otherClasses.length === 0 ? (
                <div className="text-center py-8">
                  <Copy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Tidak ada kelas lain tersedia</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Buat kelas baru untuk menyalin kurikulum
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Kelas Sumber
                    </label>
                    <select
                      value={selectedKelasId}
                      onChange={(e) => {
                        setSelectedKelasId(e.target.value);
                        setError(null);
                      }}
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {otherClasses.map((kelas) => (
                        <option key={kelas.id} value={kelas.id}>
                          {kelas.nama_kelas}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Kurikulum dari kelas ini akan disalin ke kelas saat ini
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900">
                      <strong>Catatan:</strong> Ini akan menyalin semua mata pelajaran beserta
                      guru dan jumlah jam dari kelas sumber ke kelas saat ini.
                    </p>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:flex-1"
                  disabled={loading}
                >
                  Batal
                </Button>
                {otherClasses.length > 0 && (
                  <Button
                    onClick={handleCopy}
                    className="w-full sm:flex-1"
                    disabled={loading || !selectedKelasId}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Menyalin...
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        Salin Kurikulum
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}