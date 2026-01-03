// src/pages/SchedulePageEnhanced.tsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { 
  Calendar, 
  Download, 
  AlertCircle, 
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/ButtonJ';
import { Alert, AlertDescription } from '@/components/ui/Alert';

import { useAuth } from '@/context/AuthContext';
import { gaService } from '@/services/gaService';
import { enhancedScheduleService } from '@/services/enhancedScheduleService';
import ScheduleTable from '@/components/schedule/ScheduleTable';
import ScheduleMobileView from '@/components/schedule/ScheduleMobileView';

import type { ScheduleByClass } from '@/types/schedule.types';
import type { GARun } from '@/types/database.types';

export default function SchedulePageEnhanced() {
  const { user } = useAuth();

  const [gaRuns, setGaRuns] = useState<GARun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<ScheduleByClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadGARuns();
  }, [user]);

  useEffect(() => {
    if (selectedRunId && user) loadSchedule(selectedRunId);
  }, [selectedRunId, user]);

  const loadGARuns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const runs = await gaService.getAll(user!.id);
      setGaRuns(runs);

      // Auto-select latest completed run
      const latestSuccess = runs.find(r => r.status === 'completed');
      if (latestSuccess) {
        setSelectedRunId(latestSuccess.id);
      } else if (runs.length > 0) {
        setSelectedRunId(runs[0].id);
      }
    } catch (err: any) {
      console.error('Error loading GA runs:', err);
      setError(err.message || 'Gagal memuat riwayat generate');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async (runId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await enhancedScheduleService.getEnhancedSchedule(runId, user!.id);
      setSchedules(data);
      
      console.log('Enhanced schedule loaded:', data.length, 'classes');
    } catch (err: any) {
      console.error('Error loading schedule:', err);
      setError(err.message || 'Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (kelasId: number) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(kelasId)) {
        next.delete(kelasId);
      } else {
        next.add(kelasId);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToPDF = async () => {
    if (!exportRef.current) return;

    try {
      setExporting(true);
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Get all class cards
      const classCards = exportRef.current.querySelectorAll('.schedule-class-card');
      
      for (let i = 0; i < classCards.length; i++) {
        const card = classCards[i] as HTMLElement;
        
        // Capture card as canvas
        const canvas = await html2canvas(card, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 280; // A4 landscape width in mm (minus margins)
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add new page if not first
        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      }

      const selectedRun = gaRuns.find(r => r.id === selectedRunId);
      const filename = `Jadwal_${selectedRun ? formatDate(selectedRun.timestamp_start).replace(/[\/\s:]/g, '_') : 'Export'}.pdf`;
      
      pdf.save(filename);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Gagal export PDF');
    } finally {
      setExporting(false);
    }
  };

  const deleteGARun = async () => {
    if (!selectedRunId) return;

    const selectedRun = gaRuns.find(r => r.id === selectedRunId);
    if (!selectedRun) return;

    const confirmMsg = `Apakah Anda yakin ingin menghapus jadwal dari ${formatDate(selectedRun.timestamp_start)}?\n\nSemua data jadwal terkait akan dihapus dan tidak dapat dikembalikan.`;
    
    if (!confirm(confirmMsg)) return;

    try {
      setDeleting(true);
      
      await gaService.delete(selectedRunId, user!.id);
      
      // Remove from list
      setGaRuns(prev => prev.filter(r => r.id !== selectedRunId));
      
      // Clear selection and schedule
      setSelectedRunId(null);
      setSchedules([]);
      
      alert('Jadwal berhasil dihapus');
      
      // Auto-select next available run
      const remainingRuns = gaRuns.filter(r => r.id !== selectedRunId);
      if (remainingRuns.length > 0) {
        const nextRun = remainingRuns.find(r => r.status === 'completed') || remainingRuns[0];
        setSelectedRunId(nextRun.id);
      }
    } catch (err: any) {
      console.error('Error deleting GA run:', err);
      alert('Gagal menghapus jadwal: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !schedules.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-gray-600">Memuat jadwal...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-indigo-600" />
              Jadwal Pelajaran
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Hasil generate dengan Genetic Algorithm
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* GA Run Selector */}
            <select
              value={selectedRunId || ''}
              onChange={(e) => setSelectedRunId(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Pilih Jadwal</option>
              {gaRuns.map((run) => (
                <option key={run.id} value={run.id}>
                  {formatDate(run.timestamp_start)} - {run.status === 'completed' ? '✓ Berhasil' : '✗ Gagal'}
                </option>
              ))}
            </select>

            {/* Delete Button */}
            <Button
              onClick={deleteGARun}
              disabled={deleting || !selectedRunId}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </>
              )}
            </Button>

            {/* Export Button */}
            <Button
              onClick={exportToPDF}
              disabled={exporting || !schedules.length}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Schedule Cards */}
        {schedules.length > 0 ? (
          <div ref={exportRef} className="space-y-6">
            {schedules.map((classSchedule) => {
              const isExpanded = expandedClasses.has(classSchedule.kelas_id);

              return (
                <motion.div
                  key={classSchedule.kelas_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="schedule-class-card"
                >
                  <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">{classSchedule.kelas_nama}</h2>
                            {classSchedule.tingkat && (
                              <p className="text-sm text-indigo-100">Tingkat {classSchedule.tingkat}</p>
                            )}
                          </div>
                        </div>

                        {/* Mobile Toggle Button */}
                        <button
                          onClick={() => toggleClass(classSchedule.kelas_id)}
                          className="md:hidden p-2 hover:bg-white/20 rounded-lg transition"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </CardTitle>
                    </CardHeader>

                    {/* Desktop View - Always visible */}
                    <div className="hidden md:block">
                      <CardContent className="p-4">
                        <ScheduleTable days={classSchedule.days} />
                      </CardContent>
                    </div>

                    {/* Mobile View - Collapsible */}
                    {isExpanded && (
                      <motion.div
                        className="md:hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <CardContent className="p-4">
                          <ScheduleMobileView days={classSchedule.days} />
                        </CardContent>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {selectedRunId 
                  ? 'Tidak ada jadwal untuk run yang dipilih'
                  : 'Pilih jadwal untuk ditampilkan'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        {schedules.length > 0 && (
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Keterangan:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
                  <span>Non-JP (Istirahat, Sholat, dll)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-200 border border-purple-300 rounded"></div>
                  <span>JP Tetap (Jadwal Tetap)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
                  <span>JP Biasa (Hasil GA)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}