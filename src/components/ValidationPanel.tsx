// src/components/ValidationPanel.tsx
// Component untuk menampilkan hasil validasi jadwal

import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import type { ScheduleValidationResult, ValidationIssue } from '@/lib/scheduleValidator';

interface ValidationPanelProps {
  validation: ScheduleValidationResult;
  expanded?: boolean;
}

export default function ValidationPanel({ validation, expanded = false }: ValidationPanelProps) {
  const { isValid, issues, stats } = validation;

  const getIssueIcon = (issue: ValidationIssue) => {
    if (issue.type === 'error') return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (issue.type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    return <Info className="w-4 h-4 text-blue-600" />;
  };

  const getIssueColor = (issue: ValidationIssue) => {
    if (issue.type === 'error') return 'border-l-red-500 bg-red-50';
    if (issue.type === 'warning') return 'border-l-amber-500 bg-amber-50';
    return 'border-l-blue-500 bg-blue-50';
  };

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  if (isValid) {
    return (
      <Alert variant="success">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>✅ Jadwal Valid!</strong>
          <p className="text-sm mt-1">
            {stats.totalSlots} slot terjadwal tanpa konflik. Semua slot berada dalam jam operasional kelas.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="w-5 h-5" />
          Hasil Validasi Jadwal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Total Slot</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalSlots}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600">Invalid Slot</p>
            <p className="text-xl font-bold text-red-700">{stats.invalidSlots}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-600">Konflik Guru</p>
            <p className="text-xl font-bold text-orange-700">{stats.teacherConflicts}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-600">Konflik Ruang</p>
            <p className="text-xl font-bold text-amber-700">{stats.roomConflicts}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-600">Konflik Kelas</p>
            <p className="text-xl font-bold text-yellow-700">{stats.classConflicts}</p>
          </div>
        </div>

        {/* Issue Summary */}
        <div className="flex gap-3 text-sm">
          {errors.length > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.length} Error</span>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span>{warnings.length} Warning</span>
            </div>
          )}
          {infos.length > 0 && (
            <div className="flex items-center gap-1 text-blue-600">
              <Info className="w-4 h-4" />
              <span>{infos.length} Info</span>
            </div>
          )}
        </div>

        {/* Issues List */}
        {expanded && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {/* Errors First */}
            {errors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2">Errors:</h4>
                {errors.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${getIssueColor(issue)} mb-2`}
                  >
                    <div className="flex items-start gap-2">
                      {getIssueIcon(issue)}
                      <p className="text-sm flex-1">{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-amber-700 mb-2">Warnings:</h4>
                {warnings.slice(0, 10).map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${getIssueColor(issue)} mb-2`}
                  >
                    <div className="flex items-start gap-2">
                      {getIssueIcon(issue)}
                      <p className="text-sm flex-1">{issue.message}</p>
                    </div>
                  </div>
                ))}
                {warnings.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ... dan {warnings.length - 10} warning lainnya
                  </p>
                )}
              </div>
            )}

            {/* Info (collapsed by default) */}
            {infos.length > 0 && infos.length <= 5 && (
              <div>
                <h4 className="text-sm font-semibold text-blue-700 mb-2">Info:</h4>
                {infos.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${getIssueColor(issue)} mb-2`}
                  >
                    <div className="flex items-start gap-2">
                      {getIssueIcon(issue)}
                      <p className="text-sm flex-1">{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {!isValid && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Rekomendasi:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {stats.invalidSlots > 0 && (
                <li>
                  • Periksa jam operasional kelas dan blok waktu. Pastikan semua blok waktu berada
                  dalam range jam kelas.
                </li>
              )}
              {stats.teacherConflicts > 0 && (
                <li>
                  • Ada guru yang dijadwalkan mengajar di beberapa kelas secara bersamaan. Generate
                  ulang dengan populasi lebih besar atau generasi lebih banyak.
                </li>
              )}
              {stats.roomConflicts > 0 && (
                <li>
                  • Ada ruangan yang digunakan oleh beberapa kelas secara bersamaan. Tambah jumlah
                  ruangan atau kurangi kelas paralel.
                </li>
              )}
              {stats.classConflicts > 0 && (
                <li>
                  • Ada kelas yang memiliki beberapa mata pelajaran di waktu yang sama. Ini adalah
                  error serius, sebaiknya generate ulang.
                </li>
              )}
              <li className="font-semibold mt-2">
                • Jika masalah persisten, pertimbangkan untuk: (1) Tambah jumlah generasi GA, (2)
                Tambah ukuran populasi, (3) Kurangi jumlah jam per minggu untuk beberapa mata
                pelajaran, (4) Tambah jam operasional kelas.
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}