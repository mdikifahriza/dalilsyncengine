// src/pages/ClassesPage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, BookOpen, AlertCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useClasses } from '@/hooks/useClasses';
import ClassModal from '@/components/modals/ClassModal';
import type { ClassGroup } from '@/types/database.types';

export default function ClassesPage() {
  const { classes, loading, error, createClass, updateClass, deleteClass } = useClasses();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const filteredClasses = classes.filter(cls =>
    cls.nama_kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.jurusan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cls: ClassGroup) => {
    setEditingClass(cls);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteClass(id);
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getTingkatColor = (tingkat: number | null) => {
    if (!tingkat) return 'bg-gray-100 text-gray-800';
    if (tingkat === 10) return 'bg-green-100 text-green-800';
    if (tingkat === 11) return 'bg-blue-100 text-blue-800';
    if (tingkat === 12) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Group classes by tingkat
  const groupedClasses = filteredClasses.reduce((acc, cls) => {
    const tingkat = cls.tingkat || 0;
    if (!acc[tingkat]) acc[tingkat] = [];
    acc[tingkat].push(cls);
    return acc;
  }, {} as Record<number, ClassGroup[]>);

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data kelas...</p>
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
            <BookOpen className="w-8 h-8 text-indigo-600" />
            Data Kelas
          </h1>
          <p className="text-gray-500 mt-1">Kelola data kelas dan rombongan belajar</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tambah Kelas
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Cari kelas berdasarkan nama atau jurusan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classes List */}
      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'Tidak ada hasil' : 'Belum ada data kelas'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? 'Coba kata kunci pencarian lain'
                : 'Mulai dengan menambahkan kelas pertama Anda'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="w-5 h-5 mr-2" />
                Tambah Kelas
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedClasses)
            .sort(([a], [b]) => {
              const numA = parseInt(a);
              const numB = parseInt(b);
              if (numA === 0) return 1; // Put "lainnya" at the end
              if (numB === 0) return -1;
              return numA - numB;
            })
            .map(([tingkat, classesByTingkat]) => (
              <div key={tingkat}>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                  {tingkat === '0' ? 'Lainnya' : `Kelas ${tingkat}`}
                  <span className="text-sm font-normal text-gray-500">
                    ({classesByTingkat.length} kelas)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classesByTingkat.map((cls, index) => (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900 truncate">
                              {cls.nama_kelas}
                            </span>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(cls)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirm(cls.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {cls.tingkat && (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getTingkatColor(
                                  cls.tingkat
                                )}`}
                              >
                                Kelas {cls.tingkat}
                              </span>
                            )}
                            {cls.jurusan && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {cls.jurusan}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                            Ditambahkan: {new Date(cls.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredClasses.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{classes.length}</p>
                <p className="text-sm text-gray-600">Total Kelas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {classes.filter(c => c.tingkat === 10).length}
                </p>
                <p className="text-sm text-gray-600">Kelas 10</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {classes.filter(c => c.tingkat === 11).length}
                </p>
                <p className="text-sm text-gray-600">Kelas 11</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {classes.filter(c => c.tingkat === 12).length}
                </p>
                <p className="text-sm text-gray-600">Kelas 12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan.
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

      {/* Class Modal */}
      <ClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classData={editingClass}
        onSave={async (data) => {
          try {
            if (editingClass) {
              await updateClass(editingClass.id, data);
            } else {
              await createClass(data);
            }
            setIsModalOpen(false);
          } catch (err: any) {
            alert(err.message);
          }
        }}
      />
    </div>
  );
}