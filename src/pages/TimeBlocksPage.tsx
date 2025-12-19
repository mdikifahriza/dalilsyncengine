// src/pages/TimeBlocksPage.tsx - UPDATED VERSION
// CHANGES:
// - Added per-class time block assignment UI
// - Added day-specific assignment support
// - Shows which blocks are assigned to which classes

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Clock, AlertCircle, FileStack, Users, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { timeBlockService } from '@/services/timeBlockService';
import { timeBlockKelasService } from '@/services/timeBlockKelasService';
import { schoolProfileService } from '@/services/schoolProfileService';
import { useClasses } from '@/hooks/useClasses';
import TimeBlockModal from '@/components/modals/TimeBlockModal';
import type { TimeBlock, SchoolProfile, TimeBlockKelasWithRelations } from '@/types/database.types';

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function TimeBlocksPage() {
  const { user } = useAuth();
  const { classes } = useClasses();
  
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [selectedHari, setSelectedHari] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<TimeBlockKelasWithRelations[]>([]);
  
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

  useEffect(() => {
    if (classes.length > 0 && !selectedKelas) {
      setSelectedKelas(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (selectedKelas) {
      loadAssignments();
    }
  }, [selectedKelas]);

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

  const loadAssignments = async () => {
    if (!selectedKelas) return;

    try {
      const data = await timeBlockKelasService.getByKelas(selectedKelas);
      setAssignments(data);
    } catch (err: any) {
      console.error('Error loading assignments:', err);
    }
  };

  const handleAssign = async (timeBlockId: number) => {
    if (!selectedKelas) return;

    try {
      await timeBlockKelasService.assign(selectedKelas, timeBlockId, selectedHari);
      await loadAssignments();
    } catch (err: any) {
      alert(err.message || 'Gagal assign time block');
    }
  };

  const handleUnassign = async (timeBlockId: number) => {
    if (!selectedKelas) return;

    try {
      await timeBlockKelasService.unassign(selectedKelas, timeBlockId, selectedHari);
      await loadAssignments();
    } catch (err: any) {
      alert(err.message || 'Gagal unassign time block');
    }
  };

  const isAssigned = (timeBlockId: number): boolean => {
    return assignments.some(a =>
      a.time_block_id === timeBlockId &&
      (!selectedHari || !a.hari || a.hari === selectedHari)
    );
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

  const formatTime = (time: string) => time.slice(0, 5);

  const lessonBlocks = timeBlocks.filter((b) => b.tipe_block === 'lesson' && !b.is_fixed);
  const fixedBlocks = timeBlocks.filter((b) => b.is_fixed);
  const selectedClass = classes.find(c => c.id === selectedKelas);

  const assignedBlocksCount = assignments.filter(a =>
    !selectedHari || !a.hari || a.hari === selectedHari
  ).length;

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
          <p className="text-gray-500 mt-1">Kelola struktur waktu per kelas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUseTemplate} className="flex items-center gap-2">
            <FileStack className="w-5 h-5" />
            Template
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
            <p className="text-sm text-gray-600">Total Kelas</p>
            <p className="text-2xl font-bold text-purple-600">{classes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* ✨ NEW: Per-Class Assignment Section */}
      {classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assign Blok Waktu ke Kelas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Kelas Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Kelas
              </label>
              <select
                value={selectedKelas || ''}
                onChange={(e) => setSelectedKelas(Number(e.target.value))}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map((kelas) => (
                  <option key={kelas.id} value={kelas.id}>
                    {kelas.nama_kelas}
                  </option>
                ))}
              </select>
            </div>

            {/* Hari Selector (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Hari (Opsional)
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedHari === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedHari(null)}
                >
                  Semua Hari
                </Button>
                {HARI_OPTIONS.map((hari) => (
                  <Button
                    key={hari}
                    variant={selectedHari === hari ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedHari(hari)}
                  >
                    {hari}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Pilih hari tertentu untuk mengatur jam pulang berbeda (contoh: Jumat pulang lebih awal)
              </p>
            </div>

            {/* Info */}
            {selectedClass && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedClass.nama_kelas}</strong>: {assignedBlocksCount} blok{' '}
                  {selectedHari ? `untuk ${selectedHari}` : 'total'}
                </AlertDescription>
              </Alert>
            )}

            {/* Blocks List with Assign/Unassign */}
            <div className="space-y-2">
              {lessonBlocks.map((block) => {
                const assigned = isAssigned(block.id);
                return (
                  <div
                    key={block.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                      assigned ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {assigned ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{block.nama_block}</p>
                        <p className="text-sm text-gray-600">
                          {formatTime(block.jam_mulai)} - {formatTime(block.jam_selesai)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={assigned ? 'outline' : 'default'}
                      onClick={() => assigned ? handleUnassign(block.id) : handleAssign(block.id)}
                    >
                      {assigned ? 'Unassign' : 'Assign'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View - All Blocks */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Blok Waktu (Global Pool)</CardTitle>
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
              {timeBlocks.map((block, index) => (
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
                      {block.tipe_block === 'lesson' && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                          Pelajaran
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {block.hari_berlaku && block.hari_berlaku.length > 0
                        ? `Berlaku: ${block.hari_berlaku.join(', ')}`
                        : 'Berlaku semua hari'}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Cara Kerja Baru</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Blok Waktu Global:</strong> Buat daftar semua jam pelajaran yang mungkin ada</li>
            <li>• <strong>Assign per Kelas:</strong> Pilih blok mana yang digunakan setiap kelas</li>
            <li>• <strong>Jam Pulang Berbeda:</strong> Kelas A bisa 8 jam, Kelas B bisa 6 jam</li>
            <li>• <strong>Per Hari:</strong> Jumat bisa lebih sedikit jam daripada Senin-Kamis</li>
            <li>• <strong>Blok Tetap:</strong> Istirahat, sholat akan tetap muncul di jadwal</li>
          </ul>
        </CardContent>
      </Card>

      {/* Modals */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus blok waktu ini?
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