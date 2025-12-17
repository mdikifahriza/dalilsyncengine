// src/pages/TimeBlocksPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Clock, AlertCircle, FileStack } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { timeBlockService } from '@/services/timeBlockService';
import { schoolProfileService } from '@/services/schoolProfileService';
import TimeBlockModal from '@/components/modals/TimeBlockModal';
import type { TimeBlock, SchoolProfile } from '@/types/database.types';

export default function TimeBlocksPage() {
  const { user } = useAuth();
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [blocks, profile] = await Promise.all([
        timeBlockService.getAll(user.id),
        schoolProfileService.get(user.id),
      ]);
      setTimeBlocks(blocks);
      setSchoolProfile(profile);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBlock(null);
    setIsModalOpen(true);
  };

  const handleEdit = (block: TimeBlock) => {
    setEditingBlock(block);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;

    try {
      await timeBlockService.delete(id, user.id);
      setTimeBlocks((prev) => prev.filter((b) => b.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus blok waktu');
    }
  };

  const handleSave = async (data: any) => {
    if (!user) return;

    try {
      if (editingBlock) {
        const updated = await timeBlockService.update(editingBlock.id, user.id, data);
        setTimeBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      } else {
        const created = await timeBlockService.create(user.id, data);
        setTimeBlocks((prev) => [...prev, created].sort((a, b) => a.urutan - b.urutan));
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan blok waktu');
    }
  };

  const handleUseTemplate = async () => {
    if (!user || !schoolProfile) return;

    const confirm = window.confirm(
      'Ini akan menghapus semua blok waktu yang ada dan menggantinya dengan template standar. Lanjutkan?'
    );
    if (!confirm) return;

    try {
      await timeBlockService.deleteAll(user.id);
      const template = timeBlockService.generateTemplate(schoolProfile.jenjang);
      const created = await timeBlockService.createBulk(user.id, template);
      setTimeBlocks(created);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat template');
    }
  };

  const getBlockTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lesson: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      break: 'bg-green-100 text-green-800 border-green-200',
      prayer: 'bg-purple-100 text-purple-800 border-purple-200',
      event: 'bg-amber-100 text-amber-800 border-amber-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatTime = (time: string) => {
    // Convert "07:00:00" to "07:00"
    return time.slice(0, 5);
  };

  const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return durationMinutes;
  };

  const lessonBlocks = timeBlocks.filter((b) => b.tipe_block === 'lesson');
  const fixedBlocks = timeBlocks.filter((b) => b.is_fixed);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
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
            <Clock className="w-8 h-8 text-indigo-600" />
            Blok Waktu
          </h1>
          <p className="text-gray-500 mt-1">Kelola struktur waktu pelajaran sekolah</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUseTemplate} className="flex items-center gap-2">
            <FileStack className="w-5 h-5" />
            Gunakan Template
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Tambah Blok
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Blok</p>
            <p className="text-2xl font-bold text-indigo-600">{timeBlocks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Jam Pelajaran</p>
            <p className="text-2xl font-bold text-blue-600">{lessonBlocks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Blok Tetap</p>
            <p className="text-2xl font-bold text-green-600">{fixedBlocks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Durasi</p>
            <p className="text-2xl font-bold text-purple-600">
              {timeBlocks.reduce(
                (sum, b) => sum + calculateDuration(b.jam_mulai, b.jam_selesai),
                0
              )}{' '}
              menit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Harian</CardTitle>
        </CardHeader>
        <CardContent>
          {timeBlocks.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum ada blok waktu
              </h3>
              <p className="text-gray-500 mb-6">
                Mulai dengan menambahkan blok waktu atau gunakan template
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleUseTemplate} variant="outline">
                  Gunakan Template
                </Button>
                <Button onClick={handleCreate}>Tambah Blok</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {timeBlocks.map((block, index) => {
                const duration = calculateDuration(block.jam_mulai, block.jam_selesai);
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 ${getBlockTypeColor(
                      block.tipe_block
                    )}`}
                    style={{ borderLeftWidth: '6px', borderLeftColor: block.warna }}
                  >
                    <div className="flex-shrink-0 text-center" style={{ width: '80px' }}>
                      <p className="text-sm font-mono font-bold">
                        {formatTime(block.jam_mulai)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(block.jam_selesai)}
                      </p>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{block.nama_block}</h3>
                        {block.is_fixed && (
                          <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
                            Tetap
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {duration} menit
                        {block.hari_berlaku && block.hari_berlaku.length > 0 && (
                          <> • {block.hari_berlaku.join(', ')}</>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(block)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(block.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Informasi</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              • <strong>Jam Pelajaran:</strong> Blok yang bisa dijadwalkan untuk mata pelajaran
            </li>
            <li>
              • <strong>Blok Tetap:</strong> Waktu istirahat, ibadah, atau kegiatan yang tidak
              bisa dijadwalkan
            </li>
            <li>
              • <strong>Urutan:</strong> Menentukan tampilan di jadwal (otomatis berdasarkan waktu)
            </li>
            <li>
              • <strong>Hari Berlaku:</strong> Kosongkan jika berlaku untuk semua hari
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus blok waktu ini? Tindakan ini tidak dapat
              dibatalkan.
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

      {/* Time Block Modal */}
      <TimeBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        timeBlock={editingBlock}
        existingBlocks={timeBlocks}
        onSave={handleSave}
      />
    </div>
  );
}