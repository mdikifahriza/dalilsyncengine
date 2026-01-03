// src/pages/TimeBlocksPage.tsx - REVISED for Database Schema
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Copy, X, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { timeBlockService } from '@/services/timeBlockService';
import { useClasses } from '@/hooks/useClasses';
import { curriculumService } from '@/services/curriculumService';
import type { TimeBlock, CreateTimeBlockInput, MapelKelasWithRelations, JPStatistics } from '@/types/database.types';
import { HARI_OPTIONS } from '@/types/database.types';

export default function TimeBlocksPage() {
  const { user } = useAuth();
  const { classes, updateClass } = useClasses();

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [selectedHari, setSelectedHari] = useState<string>('Senin'); // Default hari aktif pertama
  const [hariAktif, setHariAktif] = useState<string[]>(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CreateTimeBlockInput & { is_tetap?: boolean; mapel_kelas_id?: number }>({
    nama_block: '',
    jam_mulai: '07:00',
    jam_selesai: '07:45',
    urutan: 1,
    hari: 'Senin', // Wajib, default hari pertama
    warna: '#4F46E5',
    is_non_jp: false,
    is_tetap: false,
    mapel_kelas_id: undefined,
    kelas_id: 0, // Akan di-set saat open modal
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableMapels, setAvailableMapels] = useState<MapelKelasWithRelations[]>([]);
  const [selectedMapel, setSelectedMapel] = useState<MapelKelasWithRelations | null>(null);

  // Copy modal states
  const [copySourceKelas, setCopySourceKelas] = useState<string>('');
  const [copySourceHari, setCopySourceHari] = useState<string>('Senin');
  const [copying, setCopying] = useState(false);

  // Stats states
  const [jpStats, setJpStats] = useState<JPStatistics[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  useEffect(() => {
    if (classes.length > 0 && !selectedKelas) {
      setSelectedKelas(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (selectedKelas) {
      const kelas = classes.find(k => k.id === selectedKelas);
      if (kelas?.hari_aktif) {
        setHariAktif(kelas.hari_aktif);
        setSelectedHari(kelas.hari_aktif[0] || 'Senin'); // Default ke hari aktif pertama
      }
    }
  }, [selectedKelas, classes]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const blocks = await timeBlockService.getAll(user.id);
      setTimeBlocks(blocks);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const stats = await timeBlockService.getJPStatistics(user.id);
      setJpStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadMapels = async () => {
    if (!selectedKelas) return;
    try {
      const mapels = await curriculumService.getByKelas(selectedKelas);
      setAvailableMapels(mapels.filter(m => m.jumlah_jam_per_minggu > 0));
    } catch (err) {
      console.error('Error loading mapels:', err);
    }
  };

  const openCreateModal = () => {
    setEditingBlock(null);
    const filteredBlocks = timeBlocks.filter(b => b.kelas_id === selectedKelas && b.hari === selectedHari);
    const maxUrutan = Math.max(0, ...filteredBlocks.map(b => b.urutan));
    setFormData({
      nama_block: '',
      jam_mulai: '07:00',
      jam_selesai: '07:45',
      urutan: maxUrutan + 1,
      hari: selectedHari, // Wajib, dari hari yang dipilih
      warna: '#4F46E5',
      is_non_jp: false,
      is_tetap: false,
      mapel_kelas_id: undefined,
      kelas_id: selectedKelas || 0,
    });
    setFormErrors({});
    setIsModalOpen(true);
    loadMapels();
  };

  const openEditModal = (block: TimeBlock) => {
    setEditingBlock(block);
    setFormData({
      nama_block: block.nama_block,
      jam_mulai: block.jam_mulai.slice(0, 5),
      jam_selesai: block.jam_selesai.slice(0, 5),
      urutan: block.urutan,
      hari: block.hari, // Wajib
      warna: block.warna,
      is_non_jp: block.is_non_jp || false,
      is_tetap: block.is_tetap || false,
      mapel_kelas_id: block.mapel_kelas_id || undefined,
      kelas_id: block.kelas_id,
    });
    setFormErrors({});
    setIsModalOpen(true);
    loadMapels();
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.nama_block.trim()) errors.nama_block = 'Nama wajib diisi';
    if (!formData.hari) errors.hari = 'Hari wajib dipilih';
    if (formData.jam_mulai >= formData.jam_selesai) errors.jam_selesai = 'Jam selesai harus > jam mulai';
    
    if (formData.is_tetap && !formData.is_non_jp) {
      if (!formData.mapel_kelas_id) errors.mapel_kelas_id = 'Pilih mata pelajaran';
      if (!selectedMapel?.guru_id) errors.guru = 'Mapel harus punya guru';
    }

    const blocksToCheck = timeBlocks.filter(b => b.kelas_id === selectedKelas && b.hari === formData.hari && (!editingBlock || b.id !== editingBlock.id));
    for (const block of blocksToCheck) {
      const blockStart = block.jam_mulai.slice(0, 5);
      const blockEnd = block.jam_selesai.slice(0, 5);
      if ((formData.jam_mulai < blockEnd && formData.jam_selesai > blockStart)) {
        errors.jam_mulai = `Overlap dengan ${block.nama_block}`;
        break;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;

    try {
      const saveData = { ...formData };
      if (editingBlock) {
        const updated = await timeBlockService.update(editingBlock.id, user.id, saveData);
        setTimeBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
      } else {
        const created = await timeBlockService.create(user.id, saveData);
        setTimeBlocks(prev => [...prev, created].sort((a, b) => a.urutan - b.urutan));
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    try {
      await timeBlockService.delete(id, user.id);
      setTimeBlocks(prev => prev.filter(b => b.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopy = async () => {
    if (!copySourceKelas || !selectedKelas || !user) return;
    setCopying(true);
    try {
      await timeBlockService.copyBlocksByDay(user.id, parseInt(copySourceKelas), copySourceHari, selectedKelas, selectedHari);
      await loadData();
      setShowCopyModal(false);
      setCopySourceKelas('');
      setCopySourceHari('Senin');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCopying(false);
    }
  };

  const toggleHariAktif = async (hari: string) => {
    if (!selectedKelas || !user) return;
    const newHari = hariAktif.includes(hari) ? hariAktif.filter(h => h !== hari) : [...hariAktif, hari];
    try {
      await updateClass(selectedKelas, { hari_aktif: newHari });
      setHariAktif(newHari);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const jpBlocks = timeBlocks.filter(b => b.kelas_id === selectedKelas && !b.is_non_jp);
  const tetapBlocks = timeBlocks.filter(b => b.kelas_id === selectedKelas && b.is_tetap);
  const selectedClass = classes.find(c => c.id === selectedKelas);
  const otherClasses = classes.filter(c => c.id !== selectedKelas);
  const filteredBlocks = timeBlocks.filter(b => b.kelas_id === selectedKelas && b.hari === selectedHari);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-600" />
            Blok Waktu
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kelola jam pelajaran per hari</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-gray-600">Blok JP</p>
            <p className="text-xl font-bold text-indigo-600">{jpBlocks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-gray-600">Non-JP</p>
            <p className="text-xl font-bold text-gray-600">{timeBlocks.filter(b => b.kelas_id === selectedKelas && b.is_non_jp).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-gray-600">JP Tetap</p>
            <p className="text-xl font-bold text-amber-600">{tetapBlocks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-xl font-bold text-green-600">{timeBlocks.filter(b => b.kelas_id === selectedKelas).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Class and Day Settings */}
      {classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pengaturan Kelas dan Hari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Pilih Kelas</label>
              <select
                value={selectedKelas || ''}
                onChange={(e) => setSelectedKelas(Number(e.target.value))}
                className="w-full h-9 px-2 border rounded text-sm"
              >
                {classes.map(k => (
                  <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                ))}
              </select>
            </div>

            {selectedClass && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Hari Aktif</label>
                  <div className="flex flex-wrap gap-1">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(hari => (
                      <button
                        key={hari}
                        onClick={() => toggleHariAktif(hari)}
                        className={`px-2 py-1 text-xs rounded ${
                          hariAktif.includes(hari)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {hari.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Pilih Hari untuk Blok</label>
                  <select
                    value={selectedHari}
                    onChange={(e) => setSelectedHari(e.target.value)}
                    className="w-full h-9 px-2 border rounded text-sm"
                  >
                    {hariAktif.map(hari => (
                      <option key={hari} value={hari}>{hari}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowCopyModal(true)}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy dari Kelas Lain
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setShowStats(true); loadStats(); }}>
                    Lihat Statistik JP
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline per Hari */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline Blok Waktu - {selectedHari}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBlocks.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">Belum ada blok waktu untuk {selectedHari}</p>
              <Button onClick={openCreateModal}>Tambah Blok</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBlocks.map(block => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 p-3 rounded border-l-4"
                  style={{ borderLeftColor: block.warna }}
                >
                  <div className="w-16 text-center">
                    <p className="text-xs font-mono font-bold">{block.jam_mulai.slice(0, 5)}</p>
                    <p className="text-xs text-gray-500">{block.jam_selesai.slice(0, 5)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{block.nama_block}</h3>
                      {block.is_non_jp && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-200 rounded">Non-JP</span>
                      )}
                      {block.is_tetap && (
                        <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">Tetap</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Hari: {block.hari}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(block)} className="p-1.5 hover:bg-gray-100 rounded">
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button onClick={() => setDeleteConfirm(block.id)} className="p-1.5 hover:bg-gray-100 rounded">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingBlock ? 'Edit' : 'Tambah'} Blok Waktu</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nama Blok *</label>
                  <Input
                    value={formData.nama_block}
                    onChange={(e) => setFormData({ ...formData, nama_block: e.target.value })}
                    className={formErrors.nama_block ? 'border-red-500' : ''}
                  />
                  {formErrors.nama_block && <p className="text-xs text-red-600 mt-1">{formErrors.nama_block}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Urutan</label>
                  <Input
                    type="number"
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Hari *</label>
                  <select
                    value={formData.hari}
                    onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                    className="w-full h-9 px-2 border rounded text-sm"
                  >
                    {hariAktif.map(hari => (
                      <option key={hari} value={hari}>{hari}</option>
                    ))}
                  </select>
                  {formErrors.hari && <p className="text-xs text-red-600 mt-1">{formErrors.hari}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Jam Mulai</label>
                  <Input
                    type="time"
                    value={formData.jam_mulai}
                    onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                    className={formErrors.jam_mulai ? 'border-red-500' : ''}
                  />
                  {formErrors.jam_mulai && <p className="text-xs text-red-600 mt-1">{formErrors.jam_mulai}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Jam Selesai</label>
                  <Input
                    type="time"
                    value={formData.jam_selesai}
                    onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                    className={formErrors.jam_selesai ? 'border-red-500' : ''}
                  />
                  {formErrors.jam_selesai && <p className="text-xs text-red-600 mt-1">{formErrors.jam_selesai}</p>}
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_non_jp}
                      onChange={(e) => setFormData({ ...formData, is_non_jp: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Non-JP (tidak dihitung sebagai JP)</span>
                  </label>
                </div>

                {!formData.is_non_jp && (
                  <div className="col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_tetap || false}
                        onChange={(e) => setFormData({ ...formData, is_tetap: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Jadwal Tetap (tidak akan diacak oleh GA)</span>
                    </label>
                  </div>
                )}

                {formData.is_tetap && !formData.is_non_jp && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Mata Pelajaran *</label>
                    <select
                      value={formData.mapel_kelas_id || ''}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const mapel = availableMapels.find(m => m.id === id);
                        setFormData({ ...formData, mapel_kelas_id: id });
                        setSelectedMapel(mapel || null);
                      }}
                      className="w-full h-9 px-2 border rounded text-sm"
                    >
                      <option value="">Pilih Mata Pelajaran</option>
                      {availableMapels.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.mapel?.nama_mapel} ({m.jumlah_jam_per_minggu} jam/minggu)
                        </option>
                      ))}
                    </select>
                    {formErrors.mapel_kelas_id && <p className="text-xs text-red-600 mt-1">{formErrors.mapel_kelas_id}</p>}
                    {selectedMapel && (
                      <p className="text-xs text-gray-600 mt-1">
                        Guru: {selectedMapel.guru?.nama || 'Belum ditugaskan'}
                      </p>
                    )}
                    {formErrors.guru && <p className="text-xs text-red-600 mt-1">{formErrors.guru}</p>}
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="p-3 rounded border-l-4" style={{ borderLeftColor: formData.warna }}>
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <div className="flex items-center gap-3">
                  <div className="w-16 text-center">
                    <p className="text-xs font-mono font-bold">{formData.jam_mulai}</p>
                    <p className="text-xs text-gray-500">{formData.jam_selesai}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{formData.nama_block || '...'}</h3>
                    <p className="text-xs text-gray-600">
                      {(() => {
                        try {
                          const [sh, sm] = formData.jam_mulai.split(':').map(Number);
                          const [eh, em] = formData.jam_selesai.split(':').map(Number);
                          if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 'Durasi invalid';
                          return eh * 60 + em - (sh * 60 + sm);
                        } catch {
                          return 'Durasi invalid';
                        }
                      })()} menit • Hari: {formData.hari}
                      {formData.is_non_jp && ' • Non-JP'}
                      {formData.is_tetap && ' • Tetap'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Copy */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Copy Blok Waktu</h2>
              <button onClick={() => setShowCopyModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {otherClasses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Tidak ada kelas lain</p>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Kelas Sumber</label>
                    <select
                      value={copySourceKelas}
                      onChange={(e) => setCopySourceKelas(e.target.value)}
                      className="w-full h-9 px-2 border rounded text-sm"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {otherClasses.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Hari Sumber</label>
                    <select
                      value={copySourceHari}
                      onChange={(e) => setCopySourceHari(e.target.value)}
                      className="w-full h-9 px-2 border rounded text-sm"
                    >
                      {HARI_OPTIONS.map(hari => (
                        <option key={hari} value={hari}>{hari}</option>
                      ))}
                    </select>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Blok JP Tetap tidak akan ikut dicopy. Hanya blok waktu biasa yang dicopy ke hari target.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowCopyModal(false)} className="flex-1">
                      Batal
                    </Button>
                    <Button onClick={handleCopy} disabled={copying || !copySourceKelas} className="flex-1">
                      {copying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Menyalin...
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Salin
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Stats */}
      {showStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Statistik JP per Kelas</h2>
              <button onClick={() => setShowStats(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {statsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Memuat...</p>
                </div>
              ) : jpStats.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Belum ada data</p>
              ) : (
                <div className="space-y-2">
                  {jpStats.filter(s => !selectedKelas || s.kelas_id === selectedKelas).map(stat => (
                    <div
                      key={stat.kelas_id}
                      className={`p-3 rounded border ${
                        stat.is_valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-medium text-sm">{stat.kelas_nama}</p>
                          <p className="text-xs text-gray-600">
                            JP Kurikulum: {stat.jp_kurikulum} | Blok JP: {stat.jp_blocks}
                          </p>
                        </div>
                        {stat.is_valid ? (
                          <span className="text-xs text-green-700">✓ Sesuai</span>
                        ) : (
                          <span className="text-xs text-red-700">Kurang: {Math.abs(stat.difference)}</span>
                        )}
                      </div>
                      {stat.non_jp_blocks > 0 && (
                        <p className="text-xs text-gray-600">Non-JP: {stat.non_jp_blocks}</p>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                    💡 Blok JP harus ≥ JP Kurikulum. Blok Non-JP tidak dihitung.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-gray-600 mb-4">
              Yakin hapus blok waktu ini? Semua assignment terkait akan dihapus.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
                Batal
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)} className="flex-1">
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}