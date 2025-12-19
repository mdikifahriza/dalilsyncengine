// src/pages/SchedulePage.tsx - UPDATED: Conflict detection + Mobile responsive
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { 
  Calendar, 
  Download, 
  AlertCircle, 
  Clock, 
  Trash2,
  AlertTriangle,
  Coffee,
  Church,
  Users,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';

import { useAuth } from '@/context/AuthContext';
import { gaService, type GARunWithStats } from '@/services/gaService';
import { scheduleService, type ScheduleSlotWithDetails } from '@/services/scheduleService';
import { timeBlockService } from '@/services/timeBlockService';

import { useClasses } from '@/hooks/useClasses';
import { formatDate } from '@/lib/utils';
import type { TimeBlock } from '@/types/database.types';

interface Conflict {
  type: 'teacher' | 'class';
  description: string;
  slots: ScheduleSlotWithDetails[];
  severity: 'high' | 'medium';
}

export default function SchedulePage() {
  const { user } = useAuth();
  const { classes } = useClasses();

  const [gaRuns, setGaRuns] = useState<GARunWithStats[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<ScheduleSlotWithDetails[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());

  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadGARuns();
  }, [user]);

  useEffect(() => {
    if (selectedRunId) loadSchedule(selectedRunId);
  }, [selectedRunId]);

  const loadGARuns = async () => {
    try {
      setLoading(true);
      const runs = await gaService.getAllWithStats(user!.id);
      setGaRuns(runs);

      const latestSuccess = runs.find(r => r.status === 'completed');
      if (latestSuccess) setSelectedRunId(latestSuccess.id);
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
      const [scheduleData, timeBlocksData] = await Promise.all([
        scheduleService.getByGARunId(runId),
        timeBlockService.getAll(user!.id)
      ]);
      
      setSchedule(scheduleData);
      setTimeBlocks(timeBlocksData);
      
      // Detect conflicts
      const detectedConflicts = detectConflicts(scheduleData);
      setConflicts(detectedConflicts);
    } catch (err: any) {
      console.error('Error loading schedule:', err);
      setError(err.message || 'Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ NEW: Detect conflicts in schedule
   */
  const detectConflicts = (scheduleData: ScheduleSlotWithDetails[]): Conflict[] => {
    const conflicts: Conflict[] = [];

    // 1. Teacher conflicts (same teacher, same time, different classes)
    const teacherSlots = new Map<string, ScheduleSlotWithDetails[]>();
    
    scheduleData.forEach(slot => {
      const key = `${slot.guru_id}-${slot.hari}-${slot.time_block_id || slot.jam_ke}`;
      if (!teacherSlots.has(key)) {
        teacherSlots.set(key, []);
      }
      teacherSlots.get(key)!.push(slot);
    });

    teacherSlots.forEach((slots, key) => {
      if (slots.length > 1) {
        const timeBlock = timeBlocks.find(tb => tb.id === slots[0].time_block_id);
        const timeStr = timeBlock 
          ? `${formatTime(timeBlock.jam_mulai)}-${formatTime(timeBlock.jam_selesai)}`
          : `Jam ${slots[0].jam_ke}`;
        
        conflicts.push({
          type: 'teacher',
          description: `${slots[0].guru.nama} mengajar di ${slots.length} kelas pada ${slots[0].hari} ${timeStr}`,
          slots: slots,
          severity: 'high'
        });
      }
    });

    // 2. Class conflicts (same class, same time, different subjects - shouldn't happen but check anyway)
    const classSlots = new Map<string, ScheduleSlotWithDetails[]>();
    
    scheduleData.forEach(slot => {
      const key = `${slot.kelas_id}-${slot.hari}-${slot.time_block_id || slot.jam_ke}`;
      if (!classSlots.has(key)) {
        classSlots.set(key, []);
      }
      classSlots.get(key)!.push(slot);
    });

    classSlots.forEach((slots, key) => {
      if (slots.length > 1) {
        const timeBlock = timeBlocks.find(tb => tb.id === slots[0].time_block_id);
        const timeStr = timeBlock 
          ? `${formatTime(timeBlock.jam_mulai)}-${formatTime(timeBlock.jam_selesai)}`
          : `Jam ${slots[0].jam_ke}`;
        
        conflicts.push({
          type: 'class',
          description: `${slots[0].kelas.nama_kelas} memiliki ${slots.length} pelajaran pada ${slots[0].hari} ${timeStr}`,
          slots: slots,
          severity: 'high'
        });
      }
    });

    return conflicts;
  };

  const handleExportPDF = async () => {
    if (!exportRef.current) return;

    const element = exportRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4"); // Landscape for better table view

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let yPos = 0;

    if (imgH <= pageH) {
      pdf.addImage(imgData, "PNG", 0, yPos, imgW, imgH);
    } else {
      let heightLeft = imgH;
      while (heightLeft > 0) {
        pdf.addImage(imgData, "PNG", 0, yPos, imgW, imgH);
        heightLeft -= pageH;
        if (heightLeft > 0) pdf.addPage();
        yPos -= pageH;
      }
    }

    pdf.save(`jadwal_${selectedRunId}.pdf`);
  };

  const handleDeleteSchedule = async () => {
    if (!selectedRunId) return;

    const confirmDelete = window.confirm("Hapus seluruh jadwal untuk run ini?");
    if (!confirmDelete) return;

    try {
      await scheduleService.deleteByGARunId(selectedRunId);
      setSchedule([]);
      alert("Jadwal berhasil dihapus.");
    } catch (err: any) {
      console.error("Gagal hapus jadwal:", err);
      alert(err.message || "Gagal menghapus jadwal");
    }
  };

  const selectedRun = gaRuns.find(r => r.id === selectedRunId);

  const getAllTimeBlocksForSchedule = () => {
    const scheduleBlockIds = [...new Set(schedule.map(s => s.time_block_id))];
    const scheduleBlocks = scheduleBlockIds
      .map(id => timeBlocks.find(tb => tb.id === id))
      .filter(Boolean) as TimeBlock[];

    const fixedBlocks = timeBlocks.filter(tb => tb.is_fixed);

    const allBlocks = [...scheduleBlocks, ...fixedBlocks];
    return allBlocks
      .filter((block, index, self) => self.findIndex(b => b.id === block.id) === index)
      .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getFixedBlockIcon = (tipeBlock: string) => {
    switch (tipeBlock) {
      case 'break':
        return <Coffee className="w-4 h-4" />;
      case 'prayer':
        return <Church className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const toggleClassExpanded = (kelasId: number) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(kelasId)) {
      newExpanded.delete(kelasId);
    } else {
      newExpanded.add(kelasId);
    }
    setExpandedClasses(newExpanded);
  };

  if (loading && gaRuns.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (gaRuns.length === 0) {
    return (
      <div className="text-center p-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Belum Ada Jadwal</h2>
        <p className="text-gray-600 mb-6">
          Silakan generate jadwal terlebih dahulu di halaman Generator
        </p>
        <Button>Pergi ke Generator</Button>
      </div>
    );
  }

  // Filter schedule by selected class for mobile
  const displaySchedule = selectedKelasId 
    ? schedule.filter(s => s.kelas_id === selectedKelasId)
    : schedule;

  const displayClasses = selectedKelasId
    ? classes.filter(c => c.id === selectedKelasId)
    : classes;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
            Jadwal Pelajaran
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Lihat dan kelola jadwal yang telah di-generate
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="text-xs md:text-sm">
            <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Export </span>PDF
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 border-red-300 text-xs md:text-sm"
            onClick={handleDeleteSchedule}
          >
            <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Hapus</span>
          </Button>
        </div>
      </div>

      {/* Run Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            Pilih Generate Run
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Riwayat Generate ({gaRuns.length} runs)
            </label>

            <select
              value={selectedRunId || ''}
              onChange={(e) => setSelectedRunId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs md:text-sm"
            >
              {gaRuns.map((run) => (
                <option key={run.id} value={run.id}>
                  {formatDate(run.timestamp_start)} — Fitness: {run.final_fitness?.toFixed(2)} — {run.slot_count} slots
                </option>
              ))}
            </select>
          </div>

          {selectedRun && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
              <div className="p-2 md:p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">Fitness</p>
                <p className="text-lg md:text-xl font-bold text-blue-700">
                  {selectedRun.final_fitness?.toFixed(2)}
                </p>
              </div>

              <div className="p-2 md:p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600">Total Slots</p>
                <p className="text-lg md:text-xl font-bold text-green-700">{selectedRun.slot_count}</p>
              </div>

              <div className="p-2 md:p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600">Generasi</p>
                <p className="text-lg md:text-xl font-bold text-purple-700">
                  {selectedRun.generation_count || selectedRun.max_generations}
                </p>
              </div>

              <div className="p-2 md:p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-orange-600">Status</p>
                <p className="text-lg md:text-xl font-bold text-orange-700 capitalize">
                  {selectedRun.status}
                </p>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* ✅ NEW: Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <strong className="text-sm md:text-base">
                Ditemukan {conflicts.length} Konflik!
              </strong>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowConflicts(!showConflicts)}
                className="text-xs"
              >
                {showConflicts ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Sembunyikan
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Lihat Detail
                  </>
                )}
              </Button>
            </div>

            {showConflicts && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-3 space-y-2"
              >
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="p-3 bg-white rounded border border-red-200">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0">
                        {conflict.type === 'teacher' ? (
                          <Users className="w-4 h-4 text-red-600" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {conflict.description}
                        </p>
                        <div className="mt-2 space-y-1">
                          {conflict.slots.map((slot, sidx) => (
                            <p key={sidx} className="text-xs text-gray-600">
                              • {slot.kelas.nama_kelas} - {slot.mapel.nama_mapel}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ NEW: Mobile Class Filter */}
      <div className="md:hidden">
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Kelas (Mobile)
            </label>
            <select
              value={selectedKelasId || ''}
              onChange={(e) => setSelectedKelasId(e.target.value ? Number(e.target.value) : null)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="">Semua Kelas</option>
              {classes.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>
                  {kelas.nama_kelas}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>

      {/* JADWAL */}
      {schedule.length > 0 ? (
        <div ref={exportRef} className="space-y-6">

          {displayClasses.map((kelas) => {
            const classSchedule = displaySchedule.filter(s => s.kelas_id === kelas.id);
            if (classSchedule.length === 0) return null;

            const allTimeBlocks = getAllTimeBlocksForSchedule();
            const hariOperasional = kelas.hari_operasional || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            const isExpanded = expandedClasses.has(kelas.id);

            return (
              <motion.div key={kelas.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader 
                    className="pb-3 cursor-pointer md:cursor-default"
                    onClick={() => window.innerWidth < 768 && toggleClassExpanded(kelas.id)}
                  >
                    <CardTitle className="flex items-center justify-between text-sm md:text-lg">
                      <div className="flex-1">
                        <span>{kelas.nama_kelas}</span>
                        {kelas.jam_mulai && kelas.jam_selesai && (
                          <span className="text-xs md:text-sm text-gray-500 ml-2 block md:inline">
                            Jam: {formatTime(kelas.jam_mulai)} - {formatTime(kelas.jam_selesai)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm text-gray-500">
                          {classSchedule.length} JP
                        </span>
                        <div className="md:hidden">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  {/* Desktop View - Always visible */}
                  <div className="hidden md:block">
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200 text-xs md:text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 p-1 md:p-2 text-center w-16 md:w-24">
                                Waktu
                              </th>
                              {hariOperasional.map((hari) => (
                                <th key={hari} className="border border-gray-200 p-1 md:p-2 text-center font-semibold">
                                  {hari}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            {allTimeBlocks.map((timeBlock) => {
                              const isFixedBlock = timeBlock.is_fixed;

                              return (
                                <tr key={timeBlock.id} className={isFixedBlock ? 'bg-gray-100' : ''}>
                                  <td className="border border-gray-200 p-1 md:p-2 text-center bg-gray-50">
                                    <div className="font-mono text-xs font-bold">
                                      {formatTime(timeBlock.jam_mulai)}
                                    </div>
                                    <div className="font-mono text-xs text-gray-500">
                                      {formatTime(timeBlock.jam_selesai)}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
                                      {isFixedBlock && getFixedBlockIcon(timeBlock.tipe_block)}
                                      <span className="hidden md:inline">{timeBlock.nama_block}</span>
                                    </div>
                                  </td>

                                  {isFixedBlock ? (
                                    <td
                                      colSpan={hariOperasional.length}
                                      className="border border-gray-200 p-2 md:p-3 text-center bg-gradient-to-r from-green-50 to-emerald-50"
                                    >
                                      <div className="flex items-center justify-center gap-2">
                                        {getFixedBlockIcon(timeBlock.tipe_block)}
                                        <span className="font-semibold text-gray-700 text-xs md:text-sm">
                                          {timeBlock.nama_block}
                                        </span>
                                      </div>
                                    </td>
                                  ) : (
                                    hariOperasional.map((hari) => {
                                      const slot = classSchedule.find(
                                        (s) => s.hari === hari && s.time_block_id === timeBlock.id
                                      );

                                      if (!slot) {
                                        return (
                                          <td key={hari} className="border border-gray-200 p-1 md:p-2 bg-gray-50/50"></td>
                                        );
                                      }

                                      return (
                                        <td
                                          key={hari}
                                          className="border border-gray-200 p-1 md:p-2 hover:bg-indigo-50 transition"
                                        >
                                          <div className="space-y-1">
                                            <div className="font-bold text-indigo-700 text-xs">
                                              {slot.mapel.nama_mapel}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                              👤 {slot.guru.nama}
                                            </div>
                                          </div>
                                        </td>
                                      );
                                    })
                                  )}

                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </div>

                  {/* Mobile View - Collapsible */}
                  {isExpanded && (
                    <motion.div
                      className="md:hidden"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                    >
                      <CardContent className="pt-0">
                        {hariOperasional.map((hari) => (
                          <div key={hari} className="mb-4">
                            <h3 className="font-bold text-sm text-indigo-600 mb-2 border-b pb-1">
                              {hari}
                            </h3>
                            <div className="space-y-2">
                              {allTimeBlocks.map((timeBlock) => {
                                if (timeBlock.is_fixed) {
                                  return (
                                    <div key={timeBlock.id} className="p-2 bg-green-50 rounded border border-green-200">
                                      <div className="flex items-center gap-2 text-xs">
                                        {getFixedBlockIcon(timeBlock.tipe_block)}
                                        <span className="font-medium">
                                          {formatTime(timeBlock.jam_mulai)} - {formatTime(timeBlock.jam_selesai)}
                                        </span>
                                        <span className="text-gray-600">{timeBlock.nama_block}</span>
                                      </div>
                                    </div>
                                  );
                                }

                                const slot = classSchedule.find(
                                  (s) => s.hari === hari && s.time_block_id === timeBlock.id
                                );

                                if (!slot) return null;

                                return (
                                  <div key={timeBlock.id} className="p-2 bg-white border border-gray-200 rounded">
                                    <div className="flex items-start gap-2">
                                      <div className="flex-shrink-0 text-xs font-mono text-gray-600">
                                        {formatTime(timeBlock.jam_mulai)}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-bold text-sm text-indigo-700">
                                          {slot.mapel.nama_mapel}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          👤 {slot.guru.nama}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
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
            <p className="text-gray-600 text-sm md:text-base">
              Tidak ada jadwal untuk run yang dipilih
            </p>
          </CardContent>
        </Card>
      )}

      {/* INFO BOX */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4 md:p-6">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">ℹ️ Fitur Baru</h3>
          <ul className="text-xs md:text-sm text-gray-600 space-y-1">
            <li>• <strong>Deteksi Konflik</strong>: Otomatis mendeteksi bentrok guru dan kelas</li>
            <li>• <strong>Blok Tetap Tampil</strong>: Istirahat dan sholat tampil di jadwal</li>
            <li>• <strong>Mobile Friendly</strong>: Tampilan optimal di HP (tap kelas untuk expand)</li>
            <li>• <strong>Tanpa Ruangan</strong>: Sistem lebih sederhana</li>
          </ul>
        </CardContent>
      </Card>

    </div>
  );
}