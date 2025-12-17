import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import {
  Calendar,
  Download,
  AlertCircle,
  Clock,
  Trash2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';

import { useAuth } from '@/context/AuthContext';
import { gaService, type GARunWithStats } from '@/services/gaService';
import {
  scheduleService,
  type ScheduleSlotWithDetails,
} from '@/services/scheduleService';

import { formatDate } from '@/lib/utils';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const HOURS_PER_DAY = 8;

export default function SchedulePage() {
  const { user } = useAuth();

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

      const latestSuccess = runs.find((r) => r.status === 'completed');
      if (latestSuccess) setSelectedRunId(latestSuccess.id);
    } catch (err: any) {
      console.error(err);
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
      console.error(err);
      setError(err.message || 'Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // GROUP SCHEDULE BY CLASS
  // ----------------------------
  const groupedSchedules = schedule.reduce((acc, slot) => {
    const kelasId = slot.kelas_id;

    if (!acc[kelasId]) {
      acc[kelasId] = {
        kelasNama: slot.kelas.nama_kelas,
        slots: [],
      };
    }

    acc[kelasId].slots.push(slot);
    return acc;
  }, {} as Record<number, { kelasNama: string; slots: ScheduleSlotWithDetails[] }>);

  // ----------------------------
  // EXPORT PDF
  // ----------------------------
  const handleExportPDF = async () => {
    if (!exportRef.current) return;

    const canvas = await html2canvas(exportRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;

    let y = 0;
    let heightLeft = imgH;

    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 0, y, pageW, imgH);
      heightLeft -= pageH;
      if (heightLeft > 0) {
        pdf.addPage();
        y -= pageH;
      }
    }

    pdf.save(`jadwal_${selectedRunId}.pdf`);
  };

  // ----------------------------
  // DELETE SCHEDULE
  // ----------------------------
  const handleDeleteSchedule = async () => {
    if (!selectedRunId) return;
    if (!confirm('Hapus seluruh jadwal untuk run ini?')) return;

    await scheduleService.deleteByGARunId(selectedRunId);
    setSchedule([]);
    alert('Jadwal berhasil dihapus');
  };

  const selectedRun = gaRuns.find((r) => r.id === selectedRunId);

  // ----------------------------
  // LOADING
  // ----------------------------
  if (loading && gaRuns.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin h-12 w-12 border-b-2 border-indigo-600 rounded-full" />
      </div>
    );
  }

  // ----------------------------
  // EMPTY
  // ----------------------------
  if (gaRuns.length === 0) {
    return (
      <div className="text-center p-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Belum Ada Jadwal</h2>
        <p className="text-gray-600 mt-2">
          Silakan generate jadwal terlebih dahulu
        </p>
      </div>
    );
  }

  // ----------------------------
  // MAIN VIEW
  // ----------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="text-indigo-600" />
            Jadwal Pelajaran
          </h1>
          <p className="text-gray-500 mt-1">
            Semua jadwal hasil generate
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300"
            onClick={handleDeleteSchedule}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Jadwal
          </Button>
        </div>
      </div>

      {/* RUN SELECTOR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock />
            Pilih Generate Run
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedRunId || ''}
            onChange={(e) => setSelectedRunId(Number(e.target.value))}
            className="w-full border rounded-lg p-2"
          >
            {gaRuns.map((run) => (
              <option key={run.id} value={run.id}>
                {formatDate(run.timestamp_start)} — Fitness{' '}
                {run.final_fitness?.toFixed(2)} — {run.status}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* SCHEDULE */}
      {Object.keys(groupedSchedules).length > 0 ? (
        <div ref={exportRef} className="space-y-6">
          {Object.entries(groupedSchedules).map(([kelasId, data]) => (
            <motion.div
              key={kelasId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>{data.kelasNama}</span>
                    <span className="text-sm text-gray-500">
                      {data.slots.length} jam
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border p-2">Jam</th>
                          {DAYS.map((d) => (
                            <th key={d} className="border p-2">
                              {d}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: HOURS_PER_DAY }).map((_, i) => {
                          const jam = i + 1;
                          return (
                            <tr key={jam}>
                              <td className="border p-2 text-center bg-gray-50">
                                {jam}
                              </td>
                              {DAYS.map((day) => {
                                const slot = data.slots.find(
                                  (s) => s.hari === day && s.jam_ke === jam
                                );
                                return (
                                  <td key={day} className="border p-2">
                                    {slot && (
                                      <div className="text-xs space-y-1">
                                        <div className="font-bold text-indigo-700">
                                          {slot.mapel.nama_mapel}
                                        </div>
                                        <div>👤 {slot.guru.nama}</div>
                                        <div>📍 {slot.ruang.nama_ruang}</div>
                                      </div>
                                    )}
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
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              Tidak ada jadwal untuk run ini
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
