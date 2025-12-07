// src/pages/GeneratorPage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, AlertCircle, CheckCircle, Settings, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useGARunner } from '@/hooks/useGARunner';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useRooms } from '@/hooks/useRooms';

interface GeneratorPageProps {
  onNavigate?: (view: string) => void;
}

export default function GeneratorPage({ onNavigate }: GeneratorPageProps) {
  const { runGA, isRunning, progress, error } = useGARunner();
  const { teachers } = useTeachers();
  const { classes } = useClasses();
  const { subjects } = useSubjects();
  const { rooms } = useRooms();

  const [config, setConfig] = useState({
    max_generations: 100,
    population_size: 50,
  });

  const [result, setResult] = useState<any>(null);

  const canGenerate = teachers.length > 0 && classes.length > 0 && subjects.length > 0 && rooms.length > 0;

  const handleGenerate = async () => {
    setResult(null);
    const gaResult = await runGA(config);
    if (gaResult) {
      setResult(gaResult);
    }
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className={`p-4 rounded-lg ${rooms.length > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600 mb-1">Ruangan</p>
              <p className={`text-2xl font-bold ${rooms.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {rooms.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!canGenerate && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Silakan lengkapi data guru, kelas, mata pelajaran, dan ruangan terlebih dahulu sebelum generate jadwal.
          </AlertDescription>
        </Alert>
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
            disabled={!canGenerate || isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
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

              {/* Progress Bar */}
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
          <h3 className="font-semibold text-gray-900 mb-2">🧬 Cara Kerja Genetic Algorithm</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Populasi</strong>: Kumpulan kandidat jadwal (50-200 jadwal)</li>
            <li>• <strong>Selection</strong>: Pilih jadwal terbaik sebagai "parent"</li>
            <li>• <strong>Crossover</strong>: Kombinasi 2 parent menghasilkan "child"</li>
            <li>• <strong>Mutation</strong>: Perubahan random untuk variasi</li>
            <li>• <strong>Evolution</strong>: Ulangi hingga N generasi, jadwal makin optimal</li>
            <li>• <strong>Fitness</strong>: Skor kualitas (0-100, makin tinggi makin baik)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}