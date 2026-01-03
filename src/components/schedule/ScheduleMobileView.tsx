// src/components/schedule/ScheduleMobileView.tsx
import React from 'react';
import { Coffee, Church, BookOpen } from 'lucide-react';
import type { ScheduleByDay } from '@/types/schedule.types';

interface ScheduleMobileViewProps {
  days: ScheduleByDay[];
}

const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
};

const getBlockIcon = (type: string) => {
  if (type === 'non-jp') return <Coffee className="w-4 h-4" />;
  if (type === 'jp-tetap') return <Church className="w-4 h-4" />;
  return <BookOpen className="w-4 h-4" />;
};

const getBlockColor = (type: string) => {
  if (type === 'non-jp') return 'bg-green-50 border-green-300';
  if (type === 'jp-tetap') return 'bg-purple-50 border-purple-300';
  return 'bg-blue-50 border-blue-300';
};

const ScheduleMobileView: React.FC<ScheduleMobileViewProps> = ({ days }) => {
  return (
    <div className="space-y-4">
      {days.map((day) => (
        <div key={day.hari} className="border border-gray-200 rounded-lg p-3">
          <h3 className="font-bold text-base text-indigo-700 mb-3 border-b pb-2">
            {day.hari}
          </h3>
          
          <div className="space-y-2">
            {day.slots.map((slot) => {
              // Non-JP Block
              if (slot.type === 'non-jp') {
                return (
                  <div
                    key={slot.blok_waktu_id}
                    className={`p-3 rounded border ${getBlockColor(slot.type)}`}
                  >
                    <div className="flex items-center gap-2">
                      {getBlockIcon(slot.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{slot.nama_block}</span>
                          <span className="text-xs font-mono text-gray-600">
                            {formatTime(slot.jam_mulai)} - {formatTime(slot.jam_selesai)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // JP Tetap
              if (slot.type === 'jp-tetap' && slot.mapel_tetap) {
                return (
                  <div
                    key={slot.blok_waktu_id}
                    className={`p-3 rounded border ${getBlockColor(slot.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 pt-1">
                        {getBlockIcon(slot.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-purple-700">
                            {slot.mapel_tetap.mapel_nama}
                          </span>
                          <span className="text-xs font-mono text-gray-600">
                            {formatTime(slot.jam_mulai)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          👤 {slot.mapel_tetap.guru_nama}
                        </div>
                        <div className="text-xs text-purple-600 italic mt-1">
                          Jadwal Tetap
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // JP Biasa from GA
              if (slot.type === 'jp-biasa' && slot.jadwal_slot) {
                return (
                  <div
                    key={slot.blok_waktu_id}
                    className={`p-3 rounded border ${getBlockColor(slot.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 pt-1">
                        {getBlockIcon(slot.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-blue-700">
                            {slot.jadwal_slot.mapel_nama}
                          </span>
                          <span className="text-xs font-mono text-gray-600">
                            {formatTime(slot.jam_mulai)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          👤 {slot.jadwal_slot.guru_nama}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Empty slot
              return (
                <div
                  key={slot.blok_waktu_id}
                  className="p-3 rounded border border-gray-200 bg-gray-50 text-center text-xs text-gray-400"
                >
                  <span className="font-mono">{formatTime(slot.jam_mulai)}</span> - Kosong
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScheduleMobileView;
