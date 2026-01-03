// src/pages/GeneratorPage.tsx - FIXED: Remove jam_ke field
import { useState } from 'react';
import { Sparkles, Play, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { gaService } from '@/services/gaService';
import { scheduleService, CreateScheduleSlotInput } from '@/services/scheduleService';
import { timeBlockService } from '@/services/timeBlockService';
import { curriculumService } from '@/services/curriculumService';
import { GeneticAlgorithm, type Schedule } from '@/lib/geneticAlgorithm';
import type { GARun } from '@/types/database.types';

interface GAProgress {
  generation: number;
  fitness: number;
  status: 'initializing' | 'running' | 'completed' | 'failed';
}

interface GAResult {
  gaRun: GARun;
  schedule: CreateScheduleSlotInput[];
  conflicts: string[];
  fitness: number;
}

interface GeneratorPageProps {
  onNavigate?: (view: string) => void;
}

export default function GeneratorPage({ onNavigate }: GeneratorPageProps) {
  const { user } = useAuth();
  const { teachers } = useTeachers();
  const { classes } = useClasses();
  const { subjects } = useSubjects();

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<GAProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GAResult | null>(null);

  const canGenerate = teachers.length > 0 && classes.length > 0 && subjects.length > 0;

  const handleGenerate = async () => {
    if (!user) {
      setError('User tidak terautentikasi');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);
    setProgress({
      generation: 0,
      fitness: 0,
      status: 'initializing',
    });

    let gaRunRecord: GARun | null = null;

    try {
      const [allBlokWaktu, curriculum] = await Promise.all([
        timeBlockService.getAll(user.id),
        curriculumService.getAll(user.id),
      ]);

      if (allBlokWaktu.length === 0) {
        throw new Error('Tidak ada blok waktu. Silakan buat blok waktu terlebih dahulu');
      }

      if (curriculum.length === 0) {
        throw new Error('Tidak ada kurikulum. Silakan atur kurikulum terlebih dahulu');
      }

      gaRunRecord = await gaService.create(user.id);

      const ga = new GeneticAlgorithm(teachers, classes, allBlokWaktu, curriculum);

      const validation = ga.validate();
      if (!validation.valid) {
        throw new Error(`Validasi gagal:\n${validation.errors.join('\n')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('Warnings:', validation.warnings);
      }

      setProgress(prev => prev ? { ...prev, status: 'running' } : null);

      const bestSchedule = await new Promise<Schedule>((resolve) => {
        setTimeout(() => {
          const result = ga.evolve((gen, best) => {
            setProgress({
              generation: gen,
              fitness: best.fitness,
              status: 'running',
            });
          });
          resolve(result);
        }, 100);
      });

      const scheduleSlots: CreateScheduleSlotInput[] = bestSchedule.slots.map(slot => ({
        ga_run_id: gaRunRecord.id,
        kelas_id: slot.kelas_id,
        guru_id: slot.guru_id,
        mapel_id: slot.mapel_id,
        hari: slot.hari,
        blok_waktu_id: slot.blok_waktu_id,
      }));

      await scheduleService.saveBulk(scheduleSlots);

      const finalGen = progress?.generation || 500;
      await gaService.complete(gaRunRecord.id, bestSchedule.fitness, finalGen);

      setProgress(prev => prev ? { ...prev, status: 'completed' } : null);

      setResult({
        gaRun: {
          ...gaRunRecord,
          final_fitness: bestSchedule.fitness,
          generation_count: finalGen,
          status: 'completed',
        },
        schedule: scheduleSlots,
        conflicts: bestSchedule.conflicts,
        fitness: bestSchedule.fitness,
      });

    } catch (err: any) {
      console.error('GA error:', err);
      setError(err.message || 'Terjadi kesalahan saat generate jadwal');
      setProgress(prev => prev ? { ...prev, status: 'failed' } : null);

      if (gaRunRecord) {
        await gaService.fail(gaRunRecord.id);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          Buat Jadwal
        </h1>
        <p className="text-gray-500 mt-1">Algoritma Genetika + Hill Climbing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${teachers.length > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600">Guru</p>
              <p className={`text-2xl font-bold ${teachers.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {teachers.length}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${classes.length > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600">Kelas</p>
              <p className={`text-2xl font-bold ${classes.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {classes.length}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${subjects.length > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600">Mata Pelajaran</p>
              <p className={`text-2xl font-bold ${subjects.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {subjects.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!canGenerate && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lengkapi data guru, kelas, dan mata pelajaran sebelum generate jadwal
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Algoritma Otomatis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              ✨ <strong>Auto-Optimization:</strong> Algoritma akan berjalan hingga menemukan solusi optimal 
              (fitness = 100) atau maksimal 500 generasi. Kombinasi GA + Hill Climbing untuk hasil terbaik.
            </p>
            <p className="text-sm text-blue-800 mt-2">
              ℹ️ <strong>Validasi:</strong> Menghitung SEMUA JP (termasuk JP Tetap), tapi GA hanya menjadwalkan JP yang belum tetap.
            </p>
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
                Generate Jadwal Otomatis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {progress && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold">
                  Generasi {progress.generation}
                </span>
              </div>
              <span className="text-sm font-medium text-indigo-600">
                Fitness: {progress.fitness.toFixed(2)}
              </span>
            </div>

            <div className="h-3 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                style={{ width: `${Math.min(progress.fitness, 100)}%` }}
              />
            </div>

            <p className="text-sm text-gray-600 mt-3">
              {progress.status === 'initializing' && 'Mempersiapkan populasi...'}
              {progress.status === 'running' && 'Evolusi dengan GA + Hill Climbing...'}
              {progress.status === 'completed' && '✅ Selesai! Jadwal berhasil dibuat'}
              {progress.status === 'failed' && '❌ Terjadi kesalahan'}
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {result && progress?.status === 'completed' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-6 h-6" />
              Jadwal Berhasil Dibuat!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Slot</p>
                <p className="text-2xl font-bold">{result.schedule.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Fitness Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.fitness.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Konflik</p>
                <p className={`text-2xl font-bold ${result.conflicts.length === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.conflicts.length}
                </p>
              </div>
            </div>

            {result.conflicts.length > 0 && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Ditemukan {result.conflicts.length} konflik:</p>
                  <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                    {result.conflicts.slice(0, 5).map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                    {result.conflicts.length > 5 && (
                      <li className="text-xs text-gray-600">... dan {result.conflicts.length - 5} lainnya</li>
                    )}
                  </ul>
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
      )}
    </div>
  );
}