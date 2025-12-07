// src/pages/SchedulePage.tsx

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { 
  Calendar, 
  Download, 
  AlertCircle, 
  Clock, 
  Trash2 
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';

import { useAuth } from '@/context/AuthContext';
import { gaService, type GARunWithStats } from '@/services/gaService';
import { scheduleService, type ScheduleSlotWithDetails } from '@/services/scheduleService';

import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useRooms } from '@/hooks/useRooms';
import { formatDate } from '@/lib/utils';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const HOURS_PER_DAY = 8;

export default function SchedulePage() {
  const { user } = useAuth();
  const { classes } = useClasses();

  const [gaRuns, setGaRuns] = useState<GARunWithStats[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<ScheduleSlotWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);

  // ----------------------------
  // LOAD GA RUNS
  // ----------------------------
  useEffect(() => {
    if (user) loadGARuns();
  }, [user]);

  // ----------------------------
  // LOAD SCHEDULE
  // ----------------------------
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
      const data = await scheduleService.getByGARunId(runId);
      setSchedule(data);
    } catch (err: any) {
      console.error('Error loading schedule:', err);
      setError(err.message || 'Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // EXPORT PDF
  // ----------------------------
  const handleExportPDF = async () => {
    if (!exportRef.current) return;

    const element = exportRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

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

// ----------------------------
// DELETE SCHEDULE (sesuai scheduleService baru)
// ----------------------------
const handleDeleteSchedule = async () => {
  if (!selectedRunId) return;

  const confirmDelete = window.confirm("Hapus seluruh jadwal untuk run ini?");
  if (!confirmDelete) return;

  try {
    // fungsi yang benar dari scheduleService
    await scheduleService.deleteByGARunId(selectedRunId);

    setSchedule([]);
    alert("Jadwal berhasil dihapus.");
  } catch (err: any) {
    console.error("Gagal hapus jadwal:", err);
    alert(err.message || "Gagal menghapus jadwal");
  }
};

const selectedRun = gaRuns.find(r => r.id === selectedRunId);

  // ----------------------------
  // LOADING STATE
  // ----------------------------
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

  // ----------------------------
  // EMPTY RUNS STATE
  // ----------------------------
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

  // -----------------------------------------------------------
  // MAIN VIEW
  // -----------------------------------------------------------
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-indigo-600" />
            Jadwal Pelajaran
          </h1>
          <p className="text-gray-500 mt-1">Lihat dan kelola jadwal yang telah di-generate</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

          <Button variant="outline" size="sm" className="text-red-600 border-red-300"
            onClick={handleDeleteSchedule}>
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Jadwal
          </Button>
        </div>
      </div>

      {/* Run Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pilih Generate Run
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Riwayat Generate Jadwal ({gaRuns.length} runs)
              </label>

              <select
                value={selectedRunId || ''}
                onChange={(e) => setSelectedRunId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                {gaRuns.map((run) => (
                  <option key={run.id} value={run.id}>
                    {formatDate(run.timestamp_start)} – Fitness: {run.final_fitness?.toFixed(2)} – {run.status} ({run.slot_count} slots)
                  </option>
                ))}
              </select>
            </div>

            {/* RUN STATS */}
            {selectedRun && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">Fitness</p>
                  <p className="text-xl font-bold text-blue-700">
                    {selectedRun.final_fitness?.toFixed(2)}
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600">Total Slots</p>
                  <p className="text-xl font-bold text-green-700">{selectedRun.slot_count}</p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600">Generasi</p>
                  <p className="text-xl font-bold text-purple-700">
                    {selectedRun.generation_count || selectedRun.max_generations}
                  </p>
                </div>

                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-600">Status</p>
                  <p className="text-xl font-bold text-orange-700 capitalize">
                    {selectedRun.status}
                  </p>
                </div>
              </div>
            )}

          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* JADWAL */}
      {schedule.length > 0 ? (
        <div ref={exportRef} className="space-y-6">

          {classes.map((kelas) => {
            const classSchedule = schedule.filter(s => s.kelas_id === kelas.id);
            if (classSchedule.length === 0) return null;

            return (
              <motion.div key={kelas.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{kelas.nama_kelas}</span>
                      <span className="text-sm text-gray-500">{classSchedule.length} jam pelajaran</span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200 text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 p-2 text-center">Jam</th>
                            {DAYS.map((day) => (
                              <th key={day} className="border border-gray-200 p-2 text-center font-semibold">
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {Array.from({ length: HOURS_PER_DAY }).map((_, hourIdx) => {
                            const hour = hourIdx + 1;
                            return (
                              <tr key={hour}>
                                <td className="border border-gray-200 p-2 text-center bg-gray-50 font-mono text-xs">
                                  {hour}
                                </td>

                                {DAYS.map((day) => {
                                  const slot = classSchedule.find(
                                    (s) => s.hari === day && s.jam_ke === hour
                                  );

                                  if (!slot)
                                    return <td key={day} className="border border-gray-200 p-2 bg-gray-50/50"></td>;

                                  return (
                                    <td
                                      key={day}
                                      className="border border-gray-200 p-2 hover:bg-indigo-50 transition"
                                    >
                                      <div className="space-y-1">
                                        <div className="font-bold text-indigo-700 text-xs">
                                          {slot.mapel.nama_mapel}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          👤 {slot.guru.nama}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          📍 {slot.ruang.nama_ruang}
                                        </div>
                                      </div>
                                    </td>
                                  );
                                })}

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tidak ada jadwal untuk run yang dipilih</p>
          </CardContent>
        </Card>
      )}

      {/* INFO BOX */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Informasi</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Setiap generate akan membuat run baru dengan ID unik</li>
            <li>• Anda bisa memilih run mana yang ingin dilihat dari dropdown di atas</li>
            <li>• Jadwal dengan fitness score lebih tinggi biasanya lebih optimal</li>
            <li>• Export PDF untuk mencetak atau membagikan jadwal</li>
          </ul>
        </CardContent>
      </Card>

    </div>
  );
}
