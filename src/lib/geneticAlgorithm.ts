// src/lib/geneticAlgorithm.ts - FIXED: Enforce Jam Pulang Per Kelas
// Pure GA logic - No React dependencies

import type { Teacher, ClassGroup, Room, TimeBlock, MapelKelas } from '@/types/database.types';

export interface Schedule {
  slots: ScheduleGene[];
  fitness: number;
  conflicts: string[];
}

export interface ScheduleGene {
  kelas_id: number;
  guru_id: number;
  mapel_id: number;
  ruang_id: number;
  hari: string;
  time_block_id: number;
  jam_ke?: number;
}

export interface GAConfig {
  maxGenerations: number;
  populationSize: number;
  eliteSize: number;
  mutationRate: number;
  crossoverRate: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class GeneticAlgorithm {
  private config: GAConfig;
  private teachers: Teacher[];
  private classes: ClassGroup[];
  private rooms: Room[];
  private timeBlocks: TimeBlock[];
  private curriculum: MapelKelas[];

  constructor(
    config: GAConfig,
    teachers: Teacher[],
    classes: ClassGroup[],
    rooms: Room[],
    timeBlocks: TimeBlock[],
    curriculum: MapelKelas[]
  ) {
    this.config = config;
    this.teachers = teachers;
    this.classes = classes;
    this.rooms = rooms;
    this.timeBlocks = timeBlocks.filter(tb => tb.tipe_block === 'lesson' && !tb.is_fixed);
    this.curriculum = curriculum;
  }

  public evolve(onProgress?: (gen: number, best: Schedule) => void): Schedule {
    let population = this.initializePopulation();
    let bestEver: Schedule = population[0];

    for (let gen = 0; gen < this.config.maxGenerations; gen++) {
      population = population.map(schedule => ({
        ...schedule,
        fitness: this.calculateFitness(schedule),
        conflicts: this.detectConflicts(schedule),
      }));

      population.sort((a, b) => b.fitness - a.fitness);

      if (population[0].fitness > bestEver.fitness) {
        bestEver = { ...population[0] };
      }

      if (onProgress) {
        onProgress(gen + 1, bestEver);
      }

      const newPopulation: Schedule[] = [];

      for (let i = 0; i < this.config.eliteSize; i++) {
        newPopulation.push({ ...population[i] });
      }

      while (newPopulation.length < this.config.populationSize) {
        const parent1 = this.tournamentSelection(population);
        const parent2 = this.tournamentSelection(population);

        let child: Schedule;
        if (Math.random() < this.config.crossoverRate) {
          child = this.crossover(parent1, parent2);
        } else {
          child = { ...parent1 };
        }

        if (Math.random() < this.config.mutationRate) {
          child = this.mutate(child);
        }

        newPopulation.push(child);
      }

      population = newPopulation;
    }

    return bestEver;
  }

  private initializePopulation(): Schedule[] {
    const population: Schedule[] = [];

    for (let i = 0; i < this.config.populationSize; i++) {
      const schedule = this.createRandomSchedule();
      population.push(schedule);
    }

    return population;
  }

  private createRandomSchedule(): Schedule {
    const slots: ScheduleGene[] = [];

    for (const kelas of this.classes) {
      const usedSlots = new Set<string>();
      const kelasCurriculum = this.curriculum.filter(c => c.kelas_id === kelas.id);

      for (const currItem of kelasCurriculum) {
        const teacher = this.teachers.find(t => t.id === currItem.guru_id);
        if (!teacher) continue;

        const hoursNeeded = currItem.jumlah_jam_per_minggu;

        for (let h = 0; h < hoursNeeded; h++) {
          let attempts = 0;
          let assigned = false;

          while (attempts < 200 && !assigned) {
            // FIXED: Get available blocks yang sesuai jam operasional kelas
            const availableBlocks = this.getAvailableBlocksForClass(kelas);
            if (availableBlocks.length === 0) break;

            const timeBlock = availableBlocks[Math.floor(Math.random() * availableBlocks.length)];
            
            const hariOperasional = kelas.hari_operasional || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            const hari = hariOperasional[Math.floor(Math.random() * hariOperasional.length)];

            // Check if time block berlaku di hari ini
            if (timeBlock.hari_berlaku && timeBlock.hari_berlaku.length > 0) {
              if (!timeBlock.hari_berlaku.includes(hari)) {
                attempts++;
                continue;
              }
            }

            const slotKey = `${kelas.id}-${hari}-${timeBlock.id}`;

            if (!usedSlots.has(slotKey)) {
              if (teacher.hari_tidak_bisa && teacher.hari_tidak_bisa.includes(hari)) {
                attempts++;
                continue;
              }

              let room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
              
              const mapel = this.curriculum.find(c => c.mapel_id === currItem.mapel_id);
              if (mapel?.mapel?.ruang_khusus) {
                const specialRoom = this.rooms.find(r =>
                  r.nama_ruang.toLowerCase().includes(mapel.mapel.ruang_khusus!.toLowerCase())
                );
                if (specialRoom) room = specialRoom;
              }

              if (kelas.ruang_default_id && !mapel?.mapel?.ruang_khusus) {
                const defaultRoom = this.rooms.find(r => r.id === kelas.ruang_default_id);
                if (defaultRoom) room = defaultRoom;
              }

              slots.push({
                kelas_id: kelas.id,
                guru_id: teacher.id,
                mapel_id: currItem.mapel_id,
                ruang_id: room.id,
                hari: hari,
                time_block_id: timeBlock.id,
                jam_ke: timeBlock.urutan,
              });

              usedSlots.add(slotKey);
              assigned = true;
            }

            attempts++;
          }
        }
      }
    }

    return { slots, fitness: 0, conflicts: [] };
  }

  /**
   * FIXED: Get available time blocks yang STRICTLY dalam jam operasional kelas
   */
  private getAvailableBlocksForClass(kelas: ClassGroup): TimeBlock[] {
    return this.timeBlocks.filter(tb => {
      // FIXED: Strict check jam_mulai dan jam_selesai kelas
      if (kelas.jam_mulai && kelas.jam_selesai) {
        const blockStart = tb.jam_mulai.slice(0, 5); // "07:00:00" -> "07:00"
        const blockEnd = tb.jam_selesai.slice(0, 5);
        const classStart = kelas.jam_mulai.slice(0, 5);
        const classEnd = kelas.jam_selesai.slice(0, 5);

        // Block harus SEPENUHNYA dalam range kelas
        // Block start >= class start DAN block end <= class end
        return blockStart >= classStart && blockEnd <= classEnd;
      }
      return true;
    });
  }

  /**
   * FIXED: Validate apakah time block sesuai dengan jam operasional kelas
   */
  private isValidSlotForClass(slot: ScheduleGene): boolean {
    const kelas = this.classes.find(c => c.id === slot.kelas_id);
    if (!kelas) return false;

    const timeBlock = this.timeBlocks.find(tb => tb.id === slot.time_block_id);
    if (!timeBlock) return false;

    // FIXED: Check strict
    if (kelas.jam_mulai && kelas.jam_selesai) {
      const blockStart = timeBlock.jam_mulai.slice(0, 5);
      const blockEnd = timeBlock.jam_selesai.slice(0, 5);
      const classStart = kelas.jam_mulai.slice(0, 5);
      const classEnd = kelas.jam_selesai.slice(0, 5);

      return blockStart >= classStart && blockEnd <= classEnd;
    }

    return true;
  }

  private tournamentSelection(population: Schedule[], tournamentSize = 5): Schedule {
    const tournament: Schedule[] = [];

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }

    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  }

  private crossover(parent1: Schedule, parent2: Schedule): Schedule {
    const cutPoint = Math.floor(Math.random() * parent1.slots.length);

    const childSlots = [
      ...parent1.slots.slice(0, cutPoint),
      ...parent2.slots.slice(cutPoint),
    ];

    return { slots: childSlots, fitness: 0, conflicts: [] };
  }

  private mutate(schedule: Schedule): Schedule {
    const mutatedSlots = schedule.slots.map(slot => {
      if (Math.random() < 0.1) {
        const mutationType = Math.random();

        if (mutationType < 0.33) {
          // Change hari
          const kelas = this.classes.find(c => c.id === slot.kelas_id);
          const hariOperasional = kelas?.hari_operasional || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
          return { 
            ...slot, 
            hari: hariOperasional[Math.floor(Math.random() * hariOperasional.length)] 
          };
        } else if (mutationType < 0.66) {
          // FIXED: Change time block dengan validasi
          const kelas = this.classes.find(c => c.id === slot.kelas_id);
          if (kelas) {
            const availableBlocks = this.getAvailableBlocksForClass(kelas);
            if (availableBlocks.length > 0) {
              const newBlock = availableBlocks[Math.floor(Math.random() * availableBlocks.length)];
              return {
                ...slot,
                time_block_id: newBlock.id,
                jam_ke: newBlock.urutan,
              };
            }
          }
          return slot;
        } else {
          // Change room
          return {
            ...slot,
            ruang_id: this.rooms[Math.floor(Math.random() * this.rooms.length)].id,
          };
        }
      }

      return slot;
    });

    return { slots: mutatedSlots, fitness: 0, conflicts: [] };
  }

  /**
   * FIXED: Calculate fitness dengan penalty untuk slot di luar jam kelas
   */
  private calculateFitness(schedule: Schedule): number {
    let score = 100;

    // FIXED 1: Penalty BERAT untuk slot di luar jam operasional kelas
    let invalidTimeSlots = 0;
    schedule.slots.forEach(slot => {
      if (!this.isValidSlotForClass(slot)) {
        invalidTimeSlots++;
      }
    });
    score -= invalidTimeSlots * 25; // VERY HEAVY PENALTY

    // FIXED 2: Penalty untuk distribusi jam tidak merata per hari per kelas
    const dailyHoursPerClass = new Map<string, number>();
    schedule.slots.forEach(slot => {
      const key = `${slot.kelas_id}-${slot.hari}`;
      dailyHoursPerClass.set(key, (dailyHoursPerClass.get(key) || 0) + 1);
    });

    // Check apakah ada kelas yang exceed jam_selesai di hari tertentu
    dailyHoursPerClass.forEach((hours, key) => {
      const [kelasId, hari] = key.split('-');
      const kelas = this.classes.find(c => c.id === parseInt(kelasId));
      if (kelas && kelas.jam_mulai && kelas.jam_selesai) {
        // Hitung max jam per hari dari time blocks available
        const availableBlocks = this.getAvailableBlocksForClass(kelas);
        if (hours > availableBlocks.length) {
          score -= (hours - availableBlocks.length) * 10;
        }
      }
    });

    // 1. Teacher conflicts
    const teacherMap = new Map<string, number>();
    schedule.slots.forEach(slot => {
      const key = `${slot.guru_id}-${slot.hari}-${slot.time_block_id}`;
      teacherMap.set(key, (teacherMap.get(key) || 0) + 1);
    });

    teacherMap.forEach(count => {
      if (count > 1) {
        score -= (count - 1) * 15;
      }
    });

    // 2. Room conflicts
    const roomMap = new Map<string, number>();
    schedule.slots.forEach(slot => {
      const key = `${slot.ruang_id}-${slot.hari}-${slot.time_block_id}`;
      roomMap.set(key, (roomMap.get(key) || 0) + 1);
    });

    roomMap.forEach(count => {
      if (count > 1) {
        score -= (count - 1) * 15;
      }
    });

    // 3. Class conflicts
    const classMap = new Map<string, number>();
    schedule.slots.forEach(slot => {
      const key = `${slot.kelas_id}-${slot.hari}-${slot.time_block_id}`;
      classMap.set(key, (classMap.get(key) || 0) + 1);
    });

    classMap.forEach(count => {
      if (count > 1) {
        score -= (count - 1) * 20;
      }
    });

    // 4. Teacher max hours per week
    const teacherHours = new Map<number, number>();
    schedule.slots.forEach(slot => {
      teacherHours.set(slot.guru_id, (teacherHours.get(slot.guru_id) || 0) + 1);
    });

    teacherHours.forEach((hours, teacherId) => {
      const teacher = this.teachers.find(t => t.id === teacherId);
      if (teacher && hours > teacher.jam_maks) {
        score -= (hours - teacher.jam_maks) * 5;
      }
    });

    // 5. Balanced distribution across days
    const dayDistribution = new Map<string, number>();
    schedule.slots.forEach(slot => {
      dayDistribution.set(slot.hari, (dayDistribution.get(slot.hari) || 0) + 1);
    });

    const days = Array.from(dayDistribution.keys());
    if (days.length > 0) {
      const avgPerDay = schedule.slots.length / days.length;
      dayDistribution.forEach(count => {
        const deviation = Math.abs(count - avgPerDay);
        score -= deviation * 0.2;
      });
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * FIXED: Detect conflicts termasuk invalid time slots
   */
  private detectConflicts(schedule: Schedule): string[] {
    const conflicts: string[] = [];

    // FIXED: Detect invalid time slots (di luar jam operasional kelas)
    schedule.slots.forEach(slot => {
      if (!this.isValidSlotForClass(slot)) {
        const kelas = this.classes.find(c => c.id === slot.kelas_id);
        const timeBlock = this.timeBlocks.find(tb => tb.id === slot.time_block_id);
        if (kelas && timeBlock) {
          conflicts.push(
            `⚠️ ${kelas.nama_kelas} dijadwalkan di ${timeBlock.nama_block} (${timeBlock.jam_mulai}-${timeBlock.jam_selesai}) ` +
            `yang melebihi jam operasional kelas (${kelas.jam_mulai}-${kelas.jam_selesai})`
          );
        }
      }
    });

    // Teacher conflicts
    const teacherMap = new Map<string, ScheduleGene[]>();
    schedule.slots.forEach(slot => {
      const key = `${slot.guru_id}-${slot.hari}-${slot.time_block_id}`;
      if (!teacherMap.has(key)) teacherMap.set(key, []);
      teacherMap.get(key)!.push(slot);
    });

    teacherMap.forEach((slots, key) => {
      if (slots.length > 1) {
        const teacher = this.teachers.find(t => t.id === slots[0].guru_id);
        const timeBlock = this.timeBlocks.find(tb => tb.id === slots[0].time_block_id);
        conflicts.push(
          `Guru ${teacher?.nama} mengajar ${slots.length} kelas pada ${slots[0].hari} ${timeBlock?.nama_block}`
        );
      }
    });

    // Room conflicts
    const roomMap = new Map<string, ScheduleGene[]>();
    schedule.slots.forEach(slot => {
      const key = `${slot.ruang_id}-${slot.hari}-${slot.time_block_id}`;
      if (!roomMap.has(key)) roomMap.set(key, []);
      roomMap.get(key)!.push(slot);
    });

    roomMap.forEach((slots, key) => {
      if (slots.length > 1) {
        const room = this.rooms.find(r => r.id === slots[0].ruang_id);
        const timeBlock = this.timeBlocks.find(tb => tb.id === slots[0].time_block_id);
        conflicts.push(
          `Ruang ${room?.nama_ruang} digunakan ${slots.length} kelas pada ${slots[0].hari} ${timeBlock?.nama_block}`
        );
      }
    });

    return conflicts;
  }

  /**
   * FIXED: Validate schedule dengan check jam operasional
   */
  public validate(schedule: Schedule): ValidationResult {
    const errors: string[] = [];

    // FIXED: Check invalid time slots
    let invalidCount = 0;
    schedule.slots.forEach(slot => {
      if (!this.isValidSlotForClass(slot)) {
        invalidCount++;
      }
    });

    if (invalidCount > 0) {
      errors.push(
        `⚠️ Terdapat ${invalidCount} slot yang dijadwalkan di luar jam operasional kelas`
      );
    }

    // Check curriculum requirements per kelas
    for (const kelas of this.classes) {
      const kelasCurriculum = this.curriculum.filter(c => c.kelas_id === kelas.id);
      
      for (const currItem of kelasCurriculum) {
        const count = schedule.slots.filter(
          s => s.kelas_id === kelas.id && s.mapel_id === currItem.mapel_id
        ).length;

        if (count !== currItem.jumlah_jam_per_minggu) {
          errors.push(
            `Kelas ${kelas.nama_kelas} - Mapel ID ${currItem.mapel_id}: ${count} jam (seharusnya ${currItem.jumlah_jam_per_minggu})`
          );
        }
      }
    }

    // Check conflicts
    const conflicts = this.detectConflicts(schedule);
    errors.push(...conflicts);

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}