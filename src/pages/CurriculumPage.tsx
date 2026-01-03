// src/pages/CurriculumPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, BookMarked, AlertCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { curriculumService } from '@/services/curriculumService';
import CurriculumModal from '@/components/modals/CurriculumModal';
import CopyClassModal from '@/components/modals/CopyClassModal';
import TeacherHoursBox from '@/components/TeacherHoursBox';
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
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
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
    setError(null);
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
      setCurriculum((prev) => prev.filter((c) => c.id !== id));
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
        setCurriculum((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        );
      } else {
        await curriculumService.assign(user.id, {
          ...data,
          kelas_id: selectedKelas,
        });
        await loadCurriculum();
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan');
      throw err;
    }
  };

  const handleCopy = async (sourceKelasId: number) => {
    if (!user || !selectedKelas) return;

    try {
      await curriculumService.copyFromKelas(user.id, sourceKelasId, selectedKelas);
      await loadCurriculum();
      setIsCopyModalOpen(false);
    } catch (err: any) {
      throw new Error(err.message || 'Gagal copy kurikulum');
    }
  };

  const totalJam = curriculum.reduce((sum, c) => sum + c.jumlah_jam_per_minggu, 0);
  const selectedClass = classes.find((c) => c.id === selectedKelas);

  if (classes.length === 0) {
    return (
      <div className="text-center p-8 sm:p-12">
        <BookMarked className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Belum Ada Kelas</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Silakan tambahkan kelas terlebih dahulu di halaman Kelas
        </p>
        <Button>Pergi ke Kelas</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookMarked className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            Kurikulum Kelas
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Atur mata pelajaran dan jam per kelas
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCopyModalOpen(true)}
            className="w-full sm:w-auto text-sm"
          >
            <Copy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Copy dari Kelas Lain
          </Button>
          <Button onClick={handleCreate} className="w-full sm:w-auto text-sm">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Tambah Mapel
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Class Selector */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas</label>
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

      {/* Stats & Teacher Hours in Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Stats Cards */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Total Mapel</p>
            <p className="text-xl sm:text-2xl font-bold text-indigo-600">
              {curriculum.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Total Jam/Minggu</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{totalJam}</p>
          </CardContent>
        </Card>

        {/* Teacher Hours Box */}
        <div className="col-span-2">
          <TeacherHoursBox teachers={teachers} />
        </div>
      </div>
      
      {/* Curriculum Table/Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Kurikulum: {selectedClass?.nama_kelas}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">Memuat data...</p>
            </div>
          ) : curriculum.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <BookMarked className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Belum ada mata pelajaran
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-6">
                Mulai dengan menambahkan mata pelajaran untuk kelas ini
              </p>
              <Button onClick={handleCreate} className="text-sm">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Tambah Mata Pelajaran
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block lg:hidden space-y-3">
                {curriculum.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {item.mapel?.nama_mapel || 'N/A'}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {item.guru ? item.guru.nama : 'Belum ada guru'}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(item.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        <strong className="text-indigo-600">{item.jumlah_jam_per_minggu}</strong>{' '}
                        jam/minggu
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden lg:block overflow-x-auto">
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
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-indigo-600">
                            {item.jumlah_jam_per_minggu}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                            >
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full"
          >
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              Konfirmasi Hapus
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus mata pelajaran ini dari kurikulum? Jadwal yang
              terkait juga akan dihapus.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm)}
                className="w-full sm:w-auto"
              >
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

      {/* Copy Class Modal */}
      <CopyClassModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        currentKelasId={selectedKelas || 0}
        availableClasses={classes}
        onCopy={handleCopy}
      />
    </div>
  );
}