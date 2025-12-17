// src/lib/scheduleValidator.ts
// Helper functions untuk validasi jadwal

import type { ClassGroup, TimeBlock, ScheduleSlotWithDetails } from '@/types/database.types';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'high' | 'medium' | 'low';
  message: string;
  affectedSlot?: ScheduleSlotWithDetails;
  kelas?: ClassGroup;
  timeBlock?: TimeBlock;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  stats: {
    totalSlots: number;
    invalidSlots: number;
    teacherConflicts: number;
    roomConflicts: number;
    classConflicts: number;
  };
}

/**
 * Validate entire schedule
 */
export function validateSchedule(
  schedule: ScheduleSlotWithDetails[],
  classes: ClassGroup[],
  timeBlocks: TimeBlock[]
): ScheduleValidationResult {
  const issues: ValidationIssue[] = [];
  let invalidSlots = 0;
  let teacherConflicts = 0;
  let roomConflicts = 0;
  let classConflicts = 0;

  // 1. Validate time slots against class hours
  schedule.forEach(slot => {
    const kelas = classes.find(c => c.id === slot.kelas_id);
    const timeBlock = timeBlocks.find(tb => tb.id === slot.time_block_id);

    if (kelas && timeBlock) {
      if (!isSlotValidForClass(slot, kelas, timeBlock)) {
        invalidSlots++;
        issues.push({
          type: 'error',
          severity: 'high',
          message: `${kelas.nama_kelas} dijadwalkan pada ${slot.hari} jam ${formatTime(timeBlock.jam_mulai)}-${formatTime(timeBlock.jam_selesai)} yang melebihi jam operasional kelas (${formatTime(kelas.jam_mulai)}-${formatTime(kelas.jam_selesai)})`,
          affectedSlot: slot,
          kelas,
          timeBlock,
        });
      }
    }
  });

  // 2. Check teacher conflicts (same teacher, same time)
  const teacherMap = new Map<string, ScheduleSlotWithDetails[]>();
  schedule.forEach(slot => {
    const key = `${slot.guru_id}-${slot.hari}-${slot.time_block_id}`;
    if (!teacherMap.has(key)) teacherMap.set(key, []);
    teacherMap.get(key)!.push(slot);
  });

  teacherMap.forEach((slots, key) => {
    if (slots.length > 1) {
      teacherConflicts++;
      const timeBlock = timeBlocks.find(tb => tb.id === slots[0].time_block_id);
      issues.push({
        type: 'error',
        severity: 'high',
        message: `Guru ${slots[0].guru.nama} mengajar ${slots.length} kelas secara bersamaan pada ${slots[0].hari} ${timeBlock?.nama_block || ''}`,
      });
    }
  });

  // 3. Check room conflicts (same room, same time)
  const roomMap = new Map<string, ScheduleSlotWithDetails[]>();
  schedule.forEach(slot => {
    const key = `${slot.ruang_id}-${slot.hari}-${slot.time_block_id}`;
    if (!roomMap.has(key)) roomMap.set(key, []);
    roomMap.get(key)!.push(slot);
  });

  roomMap.forEach((slots, key) => {
    if (slots.length > 1) {
      roomConflicts++;
      const timeBlock = timeBlocks.find(tb => tb.id === slots[0].time_block_id);
      issues.push({
        type: 'error',
        severity: 'high',
        message: `Ruang ${slots[0].ruang.nama_ruang} digunakan oleh ${slots.length} kelas secara bersamaan pada ${slots[0].hari} ${timeBlock?.nama_block || ''}`,
      });
    }
  });

  // 4. Check class conflicts (same class, same time, different subjects)
  const classMap = new Map<string, ScheduleSlotWithDetails[]>();
  schedule.forEach(slot => {
    const key = `${slot.kelas_id}-${slot.hari}-${slot.time_block_id}`;
    if (!classMap.has(key)) classMap.set(key, []);
    classMap.get(key)!.push(slot);
  });

  classMap.forEach((slots, key) => {
    if (slots.length > 1) {
      classConflicts++;
      const timeBlock = timeBlocks.find(tb => tb.id === slots[0].time_block_id);
      issues.push({
        type: 'error',
        severity: 'high',
        message: `Kelas ${slots[0].kelas.nama_kelas} memiliki ${slots.length} mata pelajaran secara bersamaan pada ${slots[0].hari} ${timeBlock?.nama_block || ''}`,
      });
    }
  });

  // 5. Check if any class has no schedule
  classes.forEach(kelas => {
    const classSlots = schedule.filter(s => s.kelas_id === kelas.id);
    if (classSlots.length === 0) {
      issues.push({
        type: 'warning',
        severity: 'medium',
        message: `Kelas ${kelas.nama_kelas} tidak memiliki jadwal`,
        kelas,
      });
    }
  });

  // 6. Check daily distribution per class
  classes.forEach(kelas => {
    const classSlots = schedule.filter(s => s.kelas_id === kelas.id);
    const hariOperasional = kelas.hari_operasional || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    
    const dailyCount = new Map<string, number>();
    classSlots.forEach(slot => {
      dailyCount.set(slot.hari, (dailyCount.get(slot.hari) || 0) + 1);
    });

    // Check if all days have schedule
    hariOperasional.forEach(hari => {
      if (!dailyCount.has(hari)) {
        issues.push({
          type: 'info',
          severity: 'low',
          message: `Kelas ${kelas.nama_kelas} tidak memiliki jadwal pada hari ${hari}`,
          kelas,
        });
      }
    });

    // Check if any day is overloaded
    const availableBlocks = timeBlocks.filter(tb => {
      if (!kelas.jam_mulai || !kelas.jam_selesai) return true;
      const blockStart = tb.jam_mulai.slice(0, 5);
      const blockEnd = tb.jam_selesai.slice(0, 5);
      return blockStart >= kelas.jam_mulai.slice(0, 5) && blockEnd <= kelas.jam_selesai.slice(0, 5);
    });

    dailyCount.forEach((count, hari) => {
      if (count > availableBlocks.length) {
        issues.push({
          type: 'warning',
          severity: 'medium',
          message: `Kelas ${kelas.nama_kelas} memiliki ${count} slot pada ${hari}, melebihi kapasitas ${availableBlocks.length} blok waktu tersedia`,
          kelas,
        });
      }
    });
  });

  return {
    isValid: invalidSlots === 0 && teacherConflicts === 0 && roomConflicts === 0 && classConflicts === 0,
    issues: issues.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    stats: {
      totalSlots: schedule.length,
      invalidSlots,
      teacherConflicts,
      roomConflicts,
      classConflicts,
    },
  };
}

/**
 * Check if a slot is valid for a specific class
 */
export function isSlotValidForClass(
  slot: ScheduleSlotWithDetails,
  kelas: ClassGroup,
  timeBlock: TimeBlock
): boolean {
  if (!kelas.jam_mulai || !kelas.jam_selesai) return true;

  const blockStart = timeBlock.jam_mulai.slice(0, 5);
  const blockEnd = timeBlock.jam_selesai.slice(0, 5);
  const classStart = kelas.jam_mulai.slice(0, 5);
  const classEnd = kelas.jam_selesai.slice(0, 5);

  // Block must be FULLY within class hours
  return blockStart >= classStart && blockEnd <= classEnd;
}

/**
 * Get all invalid slots
 */
export function getInvalidSlots(
  schedule: ScheduleSlotWithDetails[],
  classes: ClassGroup[],
  timeBlocks: TimeBlock[]
): ScheduleSlotWithDetails[] {
  return schedule.filter(slot => {
    const kelas = classes.find(c => c.id === slot.kelas_id);
    const timeBlock = timeBlocks.find(tb => tb.id === slot.time_block_id);
    
    if (!kelas || !timeBlock) return false;
    
    return !isSlotValidForClass(slot, kelas, timeBlock);
  });
}

/**
 * Get statistics per class
 */
export function getClassStatistics(
  schedule: ScheduleSlotWithDetails[],
  kelas: ClassGroup,
  timeBlocks: TimeBlock[]
) {
  const classSlots = schedule.filter(s => s.kelas_id === kelas.id);
  
  const invalidSlots = classSlots.filter(slot => {
    const timeBlock = timeBlocks.find(tb => tb.id === slot.time_block_id);
    return timeBlock && !isSlotValidForClass(slot, kelas, timeBlock);
  });

  const dailyDistribution = new Map<string, number>();
  classSlots.forEach(slot => {
    dailyDistribution.set(slot.hari, (dailyDistribution.get(slot.hari) || 0) + 1);
  });

  return {
    totalHours: classSlots.length,
    invalidHours: invalidSlots.length,
    dailyDistribution: Object.fromEntries(dailyDistribution),
    utilizationRate: kelas.jam_mulai && kelas.jam_selesai ? 
      (classSlots.length / (timeBlocks.length * (kelas.hari_operasional?.length || 5))) * 100 : 0,
  };
}

/**
 * Format time helper
 */
function formatTime(time?: string): string {
  if (!time) return 'N/A';
  return time.slice(0, 5);
}

/**
 * Get summary text
 */
export function getValidationSummary(result: ScheduleValidationResult): string {
  const { stats, issues } = result;
  
  if (result.isValid) {
    return `✅ Jadwal valid! ${stats.totalSlots} slot terjadwal tanpa konflik.`;
  }

  const errors = issues.filter(i => i.type === 'error').length;
  const warnings = issues.filter(i => i.type === 'warning').length;
  
  return `⚠️ Ditemukan ${errors} error dan ${warnings} warning. ` +
    `Invalid slots: ${stats.invalidSlots}, Konflik guru: ${stats.teacherConflicts}, ` +
    `Konflik ruang: ${stats.roomConflicts}, Konflik kelas: ${stats.classConflicts}.`;
}