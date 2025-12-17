// src/pages/CurriculumPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, BookMarked, AlertCircle, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { curriculumService } from '@/services/curriculumService';
import CurriculumModal from '@/components/modals/CurriculumModal';
import type { MapelKelasWithRelations } from '@/types/database.types';

export default function CurriculumPage() {
  const { user } = useAuth();
  const { classes } = useClasses();
  const { subjects } = useSubjects();
  const { teachers } = useTeachers();

  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [curriculum, setCurriculum] = useState<MapelKelasWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MapelKelasWithRelations | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (classes.length > 0 && !selectedKelas) {
      setSelectedKelas(classes[0].id);
    }
  }, [classes, selectedKelas]);

  useEffect(() => {
    if (selectedKelas) {
      loadCurriculum();
    }
  }, [selectedKelas]);

  const loadCurriculum = async () => {
    if (!selectedKelas) return;

    setLoading(true);
    try {
      const data = await curriculumService.getByKelas(selectedKelas);
      setCurriculum(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat kurikulum');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MapelKelasWithRelations) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;

    try {
      await curriculumService.delete(id, user.id);
      setCurriculum(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const handleSave = async (data: any) => {
    if (!user || !selectedKelas) return;

    try {
      if (editingItem) {
        const updated = await curriculumService.update(editingItem.id, user.id, data);
        setCurriculum(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      } else {
        const created = await curriculumService.assign(user.id, {
          ...data,
          kelas_id: selectedKelas,
        });
        await loadCurriculum(); // Reload to get relations
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan');
    }
  };

  const handleCopy = async () => {
    if (!user || !selectedKelas) return;

    const sourceKelasId = prompt('Masukkan ID kelas sumber untuk copy kurikulum:');
    if (!sourceKelasId) return;

    try {
      await curriculumService.copyFromKelas(user.id, parseInt(sourceKelasId), selectedKelas);
      await loadCurriculum();
    } catch (err: any) {
      alert(err.message || 'Gagal copy kurikulum');
    }
  };

  const totalJam = curriculum.reduce((sum, c) => sum + c.jumlah_jam_per_minggu, 0);
  const withoutTeacher = curriculum.filter(c => !c.guru_id).length;

  const selectedClass = classes.find(c => c.id === selectedKelas);

  if (classes.length === 0) {
    return (
      <div className="text-center p-12">
        <BookMarked className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Belum Ada Kelas</h2>
        <p className="text-gray-600 mb-6">
          Silakan tambahkan kelas terlebih dahulu di halaman Kelas
        </p>
        <Button>Pergi ke Kelas</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookMarked className="w-8 h-8 text-indigo-600" />
            Kurikulum Kelas
          </h1>
          <p className="text-gray-500 mt-1">Atur mata pelajaran dan jam per kelas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="w-5 h-5 mr-2" />
            Copy dari Kelas Lain
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-5 h-5 mr-2" />
            Tambah Mapel
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Class Selector */}
      <Card>
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Mapel</p>
            <p className="text-2xl font-bold text-indigo-600">{curriculum.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Jam/Minggu</p>
            <p className="text-2xl font-bold text-green-600">{totalJam}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Tanpa Guru</p>
            <p className={`text-2xl font-bold ${withoutTeacher > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {withoutTeacher}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Curriculum Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Kurikulum: {selectedClass?.nama_kelas}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data...</p>
            </div>
          ) : curriculum.length === 0 ? (
            <div className="text-center py-12">
              <BookMarked className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum ada mata pelajaran
              </h3>
              <p className="text-gray-500 mb-6">
                Mulai dengan menambahkan mata pelajaran untuk kelas ini
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-5 h-5 mr-2" />
                Tambah Mata Pelajaran
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mata Pelajaran
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Guru
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Jam/Minggu
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Prioritas
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {curriculum.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {item.mapel?.nama_mapel || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.guru ? (
                          <span className="text-gray-700">{item.guru.nama}</span>
                        ) : (
                          <span className="text-red-600 text-sm">Belum ditugaskan</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-indigo-600">
                          {item.jumlah_jam_per_minggu}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.prioritas === 1
                              ? 'bg-blue-100 text-blue-800'
                              : item.prioritas === 2
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.prioritas === 1
                            ? 'Wajib'
                            : item.prioritas === 2
                            ? 'Muatan Lokal'
                            : 'Ekstrakurikuler'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      {withoutTeacher > 0 && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Terdapat {withoutTeacher} mata pelajaran yang belum ditugaskan guru. Silakan assign
            guru untuk dapat generate jadwal.
          </AlertDescription>
        </Alert>
      )}

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
              Apakah Anda yakin ingin menghapus mata pelajaran ini dari kurikulum?
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

      {/* Curriculum Modal */}
      <CurriculumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        curriculumItem={editingItem}
        subjects={subjects}
        teachers={teachers}
        onSave={handleSave}
      />
    </div>
  );
}