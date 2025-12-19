// src/pages/GeneratorPage.tsx - UPDATED: Remove rooms, add time blocks validation
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, AlertCircle, CheckCircle, Settings, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useGARunner } from '@/hooks/useGARunner';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
// ❌ REMOVED: import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/context/AuthContext';
import { timeBlockKelasService } from '@/services/timeBlockKelasService';

interface GeneratorPageProps {
  onNavigate?: (view: string) => void;
}

export default function GeneratorPage({ onNavigate }: GeneratorPageProps) {
  const { user } = useAuth();
  const { runGA, isRunning, progress, error } = useGARunner();
  const { teachers } = useTeachers();
  const { classes } = useClasses();
  const { subjects } = useSubjects();
  // ❌ REMOVED: const { rooms } = useRooms();

  const [config, setConfig] = useState({
    max_generations: 100,
    population_size: 50,
  });

  const [result, setResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);

  // ✅ UPDATED: Remove rooms from canGenerate check
  const canGenerate = teachers.length > 0 && classes.length > 0 && subjects.length > 0;

  // ✅ NEW: Validate time block assignments on mount
  useEffect(() => {
    if (classes.length > 0 && user) {
      validateTimeBlockAssignments();
    }
  }, [classes, user]);

  // ✅ NEW: Validation function
  const validateTimeBlockAssignments = async () => {
    if (!user) return;
    
    setValidating(true);
    const errors: string[] = [];

    for (const kelas of classes) {
      const hariOperasional = kelas.hari_operasional || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      
      for (const hari of hariOperasional) {
        try {
          const availability = await timeBlockKelasService.getAvailableBlocksCount(kelas.id, hari);
          
          if (availability === 0) {
            errors.push(`Kelas ${kelas.nama_kelas} - ${hari}: Tidak ada blok waktu yang di-assign`);
          }
        } catch (err) {
          console.error('Error checking availability:', err);
        }
      }
    }

    setValidationErrors(errors);
    setValidating(false);
  };

  const handleGenerate = async () => {
    // ✅ NEW: Validate first
    await validateTimeBlockAssignments();
    
    if (validationErrors.length > 0) {
      alert('Validasi gagal! Periksa assignment time blocks ke kelas.');
      return;
    }

    setResult(null);
    const gaResult = await runGA(config);
    if (gaResult) {
      setResult(gaResult);
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return 'N/A';
    return time.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          Buat Jadwal
        </h1>
        <p className="text-gray-500 mt-1">
          menggunakan Algoritma Genetika
        </p>
      </div>

      {/* Data Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Status Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ✅ UPDATED: Removed rooms from grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${teachers.length > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600 mb-1">Guru</p>
              <p className={`text-2xl font-bold ${teachers.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {teachers.length}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${classes.length > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600 mb-1">Kelas</p>
              <p className={`text-2xl font-bold ${classes.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {classes.length}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${subjects.length > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600 mb-1">Mata Pelajaran</p>
              <p className={`text-2xl font-bold ${subjects.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {subjects.length}
              </p>
            </div>
            {/* ❌ REMOVED: Ruangan card */}
          </div>
        </CardContent>
      </Card>

      {!canGenerate && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Silakan lengkapi data guru, kelas, dan mata pelajaran terlebih dahulu sebelum generate jadwal.
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ NEW: Validation Errors Display */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">Validasi Gagal - Time Blocks Belum Di-assign:</p>
            <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
              {validationErrors.slice(0, 10).map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
              {validationErrors.length > 10 && (
                <li className="text-xs text-gray-600">
                  ... dan {validationErrors.length - 10} error lainnya
                </li>
              )}
            </ul>
            <p className="mt-3 text-xs">
              💡 Silakan assign time blocks ke semua kelas di halaman <strong>Blok Waktu</strong>
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Class Operating Hours Info */}
      {classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Jam Operasional Kelas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classes.map(kelas => (
                <div key={kelas.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{kelas.nama_kelas}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {formatTime(kelas.jam_mulai)} - {formatTime(kelas.jam_selesai)}
                    </span>
                    <span className="text-gray-500">
                      {kelas.hari_operasional?.length || 5} hari
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Setiap kelas bisa punya jam pulang berbeda
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Genetic Algorithm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Generasi
              </label>
              <Input
                type="number"
                min="10"
                max="500"
                value={config.max_generations}
                onChange={(e) => setConfig({ ...config, max_generations: parseInt(e.target.value) })}
                disabled={isRunning}
              />
              <p className="text-xs text-gray-500 mt-1">
                Semakin banyak generasi, hasil semakin optimal (10-500)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ukuran Populasi
              </label>
              <Input
                type="number"
                min="10"
                max="200"
                value={config.population_size}
                onChange={(e) => setConfig({ ...config, population_size: parseInt(e.target.value) })}
                disabled={isRunning}
              />
              <p className="text-xs text-gray-500 mt-1">
                Jumlah kandidat jadwal per generasi (10-200)
              </p>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isRunning || validating || validationErrors.length > 0}
            className="w-full"
            size="lg"
          >
            {validating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Memvalidasi...
              </>
            ) : isRunning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Generate Jadwal
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress */}
      {progress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold text-gray-900">
                    Progress: Generasi {progress.generation} / {progress.maxGenerations}
                  </span>
                </div>
                <span className="text-sm font-medium text-indigo-600">
                  Fitness: {progress.fitness.toFixed(2)}
                </span>
              </div>

              <div className="h-3 bg-white rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress.generation / progress.maxGenerations) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <p className="text-sm text-gray-600 mt-3">
                {progress.status === 'initializing' && 'Mempersiapkan populasi...'}
                {progress.status === 'running' && 'Evolusi populasi dengan selection, crossover, dan mutation...'}
                {progress.status === 'completed' && 'Selesai! Jadwal berhasil dibuat.'}
                {progress.status === 'failed' && 'Terjadi kesalahan.'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && progress?.status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-6 h-6" />
                Jadwal Berhasil Dibuat!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Slot</p>
                  <p className="text-2xl font-bold text-gray-900">{result.schedule.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Fitness Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {result.fitness.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Konflik</p>
                  <p className="text-2xl font-bold text-red-600">
                    {result.conflicts.length}
                  </p>
                </div>
              </div>

              {result.conflicts.length > 0 && (
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ditemukan {result.conflicts.length} konflik. 
                    Pertimbangkan untuk menjalankan ulang dengan konfigurasi berbeda atau generasi lebih banyak.
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => onNavigate?.('schedule')}
              >
                Lihat Jadwal
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">🧬 Fitur Baru</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Jam Pulang Berbeda</strong>: Setiap kelas bisa punya jadwal sendiri</li>
            <li>• <strong>Jumat Lebih Pendek</strong>: Hari tertentu bisa punya jam berbeda</li>
            <li>• <strong>Tanpa Ruangan</strong>: Sistem lebih sederhana tanpa konflik ruang</li>
            <li>• <strong>Validasi Otomatis</strong>: Cek JP vs time blocks sebelum generate</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 