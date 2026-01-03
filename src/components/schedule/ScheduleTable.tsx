// src/components/schedule/ScheduleTable.tsx
import React from 'react';
import { Coffee, Church, BookOpen } from 'lucide-react';
import type { ScheduleByDay, EnhancedScheduleSlot } from '@/types/schedule.types';

interface ScheduleTableProps {
  days: ScheduleByDay[];
  className?: string;
}

const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5); // HH:MM
};

const getBlockIcon = (type: string) => {
  if (type === 'non-jp') return <Coffee className="w-3 h-3" />;
  if (type === 'jp-tetap') return <Church className="w-3 h-3" />;
  return <BookOpen className="w-3 h-3" />;
};

const getBlockColor = (type: string) => {
  if (type === 'non-jp') return 'bg-green-50 border-green-300';
  if (type === 'jp-tetap') return 'bg-purple-50 border-purple-300';
  return 'bg-blue-50 border-blue-300';
};

const ScheduleTable: React.FC<ScheduleTableProps> = ({ days, className = '' }) => {
  // Hitung unik time slots dengan benar
  const uniqueTimeSlots = new Map<string, EnhancedScheduleSlot>();
  
  days.forEach(day => {
    day.slots.forEach(slot => {
      const key = `${slot.urutan}`;
      if (!uniqueTimeSlots.has(key)) {
        uniqueTimeSlots.set(key, slot);
      }
    });
  });

  const sortedTimeSlots = Array.from(uniqueTimeSlots.values())
    .sort((a, b) => a.urutan - b.urutan);

  // Hitung jumlah hari yang aktif
  const activeDays = days.filter(d => d.slots.length > 0);

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse border border-gray-300 text-xs">
        <thead>
          <tr className="bg-gray-100">
            {activeDays.map((day) => (
              <th key={day.hari} className="border border-gray-300 p-2 text-center font-semibold text-sm">
                {day.hari}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedTimeSlots.map((timeSlot, idx) => (
            <tr key={`${timeSlot.urutan}-${idx}`}>
              {activeDays.map((day) => {
                const slot = day.slots.find(s => s.urutan === timeSlot.urutan);

                if (!slot) {
                  return (
                    <td key={day.hari} className="border border-gray-300 p-1 bg-gray-50/30 min-h-[60px]"></td>
                  );
                }

                // Non-JP: Show name + time
                if (slot.type === 'non-jp') {
                  return (
                    <td
                      key={day.hari}
                      className={`border border-gray-300 p-2 text-center ${getBlockColor(slot.type)}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1 text-gray-700 font-medium">
                          {getBlockIcon(slot.type)}
                          <span>{slot.nama_block}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {formatTime(slot.jam_mulai)} - {formatTime(slot.jam_selesai)}
                        </div>
                      </div>
                    </td>
                  );
                }

                // JP Tetap: Show nama_block + time + mapel + guru
                if (slot.type === 'jp-tetap' && slot.mapel_tetap) {
                  return (
                    <td
                      key={day.hari}
                      className={`border border-gray-300 p-2 ${getBlockColor(slot.type)}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-gray-600 text-xs">
                          {getBlockIcon(slot.type)}
                          <span className="font-medium">{slot.nama_block}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {formatTime(slot.jam_mulai)} - {formatTime(slot.jam_selesai)}
                        </div>
                        <div className="font-bold text-purple-700 text-sm">
                          {slot.mapel_tetap.mapel_nama}
                        </div>
                        <div className="text-gray-600 text-xs">
                          👤 {slot.mapel_tetap.guru_nama}
                        </div>
                      </div>
                    </td>
                  );
                }

                // JP Biasa: Show nama_block + time + mapel + guru from GA
                if (slot.type === 'jp-biasa' && slot.jadwal_slot) {
                  return (
                    <td
                      key={day.hari}
                      className={`border border-gray-300 p-2 ${getBlockColor(slot.type)}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-gray-600 text-xs">
                          {getBlockIcon(slot.type)}
                          <span className="font-medium">{slot.nama_block}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {formatTime(slot.jam_mulai)} - {formatTime(slot.jam_selesai)}
                        </div>
                        <div className="font-bold text-blue-700 text-sm">
                          {slot.jadwal_slot.mapel_nama}
                        </div>
                        <div className="text-gray-600 text-xs">
                          👤 {slot.jadwal_slot.guru_nama}
                        </div>
                      </div>
                    </td>
                  );
                }

                // Empty JP slot (no assignment yet)
                return (
                  <td
                    key={day.hari}
                    className="border border-gray-300 p-2 bg-gray-50/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        {getBlockIcon(slot.type)}
                        <span className="font-medium">{slot.nama_block}</span>
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {formatTime(slot.jam_mulai)} - {formatTime(slot.jam_selesai)}
                      </div>
                      <div className="text-center text-xs text-gray-400 italic">
                        Kosong
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;