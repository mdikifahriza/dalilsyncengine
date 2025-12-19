// src/lib/geneticAlgorithm.ts - UPDATED VERSION
// CHANGES:
// - REMOVED: All Room-related logic, ruang_id from ScheduleGene
// - ADDED: TimeBlockKelas support for per-class time blocks
// - UPDATED: Uses time_blocks_kelas assignments instead of global time blocks

import type { 
  Teacher, 
  ClassGroup, 
  TimeBlock, 
  MapelKelas,
  TimeBlockKelasWithRelations 
} from '@/types/database.types';

export interface Schedule {
  slots: ScheduleGene[];
  fitness: number;
  conflicts: string[];
}

// ❌ REMOVED: ruang_id
export interface ScheduleGene {
  kelas_id: number;
  guru_id: number;
  mapel_id: number;
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
  // ❌ REMOVED: private rooms: Room[];
  private timeBlocks: TimeBlock[]; // Global pool of time blocks
  private timeBlocksKelas: TimeBlockKelasWithRelations[]; // ✨ NEW: Per-class assignments
  private curriculum: MapelKelas[];

  constructor(
    config: GAConfig,
    teachers: Teacher[],
    classes: ClassGroup[],
    // ❌ REMOVED: rooms: Room[],
    timeBlocks: TimeBlock[],
    timeBlocksKelas: TimeBlockKelasWithRelations[], // ✨ NEW
    curriculum: MapelKelas[]
  ) {
    this.config = config;
    this.teachers = teachers;
    this.classes = classes;
    // ❌ REMOVED: this.rooms = rooms;
    this.timeBlocks = timeBlocks; // Keep all time blocks for reference
    this.timeBlocksKelas = timeBlocksKelas; // ✨ NEW: Assignments
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
      population.push(this.createRandomSchedule());
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
            // ✨ NEW: Get available blocks yang sudah di-assign ke kelas ini
            const hariOperasional = kelas.hari_operasional || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            const hari = hariOperasional[Math.floor(Math.random() * hariOperasional.length)];

            const availableBlocks = this.getAvailableBlocksForClassAndDay(kelas.id, hari);
            
            if (availableBlocks.length === 0) {
              attempts++;
              continue;
            }

            const timeBlock = availableBlocks[Math.floor(Math.random() * availableBlocks.length)];

            const slotKey = `${kelas.id}-${hari}-${timeBlock.id}`;

            if (!usedSlots.has(slotKey)) {
              if (teacher.hari_tidak_bisa && teacher.hari_tidak_bisa.includes(hari)) {
                attempts++;
                continue;
              }

              slots.push({
                kelas_id: kelas.id,
                guru_id: teacher.id,
                mapel_id: currItem.mapel_id,
                // ❌ REMOVED: ruang_id
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
   * ✨ NEW: Get available time blocks for specific class and day
   * Returns only LESSON blocks that are assigned to this class
   */
  private getAvailableBlocksForClassAndDay(kelasId: number, hari: string): TimeBlock[] {
    // Filter assignments untuk kelas ini di hari ini
    const kelasAssignments = this.timeBlocksKelas.filter(tbk =>
      tbk.kelas_id === kelasId &&
      (!tbk.hari || tbk.hari === hari) &&
      tbk.time_block?.tipe_block === 'lesson'
    );

    // Return the actual time blocks
    return kelasAssignments
      .map(tbk => tbk.time_block)
      .filter((tb): tb is TimeBlock => tb !== undefined)
      .sort((a, b) => a.urutan - b.urutan);
  }

  /**
   * ✨ UPDATED: Validate apakah time block valid untuk kelas ini
   */
  private isValidSlotForClass(slot: ScheduleGene): boolean {
    const kelas = this.classes.find(c => c.id === slot.kelas_id);
    if (!kelas) return false;

    // Check if this time block is assigned to this class for this day
    const isAssigned = this.timeBlocksKelas.some(tbk =>
      tbk.kelas_id === slot.kelas_id &&
      tbk.time_block_id === slot.time_block_id &&
      (!tbk.hari || tbk.hari === slot.hari) &&
      tbk.time_block?.tipe_block === 'lesson'
    );

    return isAssigned;
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
    const crossoverPoint = Math.floor(Math.random() * parent1.slots.length);
    const childSlots = [
      ...parent1.slots.slice(0, crossoverPoint),
      ...parent2.slots.slice(crossoverPoint),
    ];

    return { slots: childSlots, fitness: 0, conflicts: [] };
  }

  private mutate(schedule: Schedule): Schedule {
    const mutatedSlots = [...schedule.slots];

    if (mutatedSlots.length === 0) return schedule;

    const randomIndex = Math.floor(Math.random() * mutatedSlots.length);
    const slot = mutatedSlots[randomIndex];

    const kelas = this.classes.find(c => c.id === slot.kelas_id);
    if (!kelas) return schedule;

    const hariOperasional = kelas.hari_operasional || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const newHari = hariOperasional[Math.floor(Math.random() * hariOperasional.length)];

    const availableBlocks = this.getAvailableBlocksForClassAndDay(slot.kelas_id, newHari);
    
    if (availableBlocks.length === 0) return schedule;

    const newTimeBlock = availableBlocks[Math.floor(Math.random() * availableBlocks.length)];

    mutatedSlots[randomIndex] = {
      ...slot,
      hari: newHari,
      time_block_id: newTimeBlock.id,
      jam_ke: newTimeBlock.urutan,
    };

    return { slots: mutatedSlots, fitness: 0, conflicts: [] };
  }

  private calculateFitness(schedule: Schedule): number {
    let fitness = 100;
    const conflicts = this.detectConflicts(schedule);

    fitness -= conflicts.length * 5;

    // Bonus: Prefer consecutive lessons
    for (const kelas of this.classes) {
      const kelasSlots = schedule.slots
        .filter(s => s.kelas_id === kelas.id)
        .sort((a, b) => {
          if (a.hari !== b.hari) {
            return a.hari.localeCompare(b.hari);
          }
          return (a.jam_ke || 0) - (b.jam_ke || 0);
        });

      let consecutiveCount = 0;
      for (let i = 1; i < kelasSlots.length; i++) {
        if (
          kelasSlots[i].hari === kelasSlots[i - 1].hari &&
          (kelasSlots[i].jam_ke || 0) === (kelasSlots[i - 1].jam_ke || 0) + 1
        ) {
          consecutiveCount++;
        }
      }
      fitness += consecutiveCount * 0.5;
    }

    // Bonus: Balanced distribution
    for (const kelas of this.classes) {
      const hariOperasional = kelas.hari_operasional || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      const slotsPerDay: { [hari: string]: number } = {};

      hariOperasional.forEach(hari => {
        slotsPerDay[hari] = schedule.slots.filter(
          s => s.kelas_id === kelas.id && s.hari === hari
        ).length;
      });

      const avg = Object.values(slotsPerDay).reduce((a, b) => a + b, 0) / hariOperasional.length;
      const variance = Object.values(slotsPerDay).reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / hariOperasional.length;

      fitness -= variance * 0.2;
    }

    return Math.max(0, fitness);
  }

  private detectConflicts(schedule: Schedule): string[] {
    const conflicts: string[] = [];

    // 1. Teacher conflicts (same teacher, same time, same day)
    const teacherSlots: { [key: string]: ScheduleGene[] } = {};

    for (const slot of schedule.slots) {
      const key = `${slot.guru_id}-${slot.hari}-${slot.time_block_id}`;
      if (!teacherSlots[key]) {
        teacherSlots[key] = [];
      }
      teacherSlots[key].push(slot);

      if (teacherSlots[key].length > 1) {
        const teacher = this.teachers.find(t => t.id === slot.guru_id);
        conflicts.push(
          `Guru "${teacher?.nama}" mengajar di ${teacherSlots[key].length} kelas pada ${slot.hari} jam ${slot.jam_ke}`
        );
      }
    }

    // ❌ REMOVED: Room conflicts (no longer checking room conflicts)

    // 2. Class conflicts (same class, same time, same day)
    const classSlots: { [key: string]: ScheduleGene[] } = {};

    for (const slot of schedule.slots) {
      const key = `${slot.kelas_id}-${slot.hari}-${slot.time_block_id}`;
      if (!classSlots[key]) {
        classSlots[key] = [];
      }
      classSlots[key].push(slot);

      if (classSlots[key].length > 1) {
        const kelas = this.classes.find(c => c.id === slot.kelas_id);
        conflicts.push(
          `Kelas "${kelas?.nama_kelas}" memiliki ${classSlots[key].length} pelajaran pada ${slot.hari} jam ${slot.jam_ke}`
        );
      }
    }

    // 3. Teacher max hours per week
    const teacherHours: { [teacherId: number]: number } = {};

    for (const slot of schedule.slots) {
      teacherHours[slot.guru_id] = (teacherHours[slot.guru_id] || 0) + 1;
    }

    for (const teacherId in teacherHours) {
      const teacher = this.teachers.find(t => t.id === Number(teacherId));
      if (teacher && teacherHours[teacherId] > teacher.jam_maks) {
        conflicts.push(
          `Guru "${teacher.nama}" melebihi jam maksimal (${teacherHours[teacherId]}/${teacher.jam_maks})`
        );
      }
    }

    // 4. ✨ NEW: Check if slots use time blocks assigned to their class
    for (const slot of schedule.slots) {
      if (!this.isValidSlotForClass(slot)) {
        const kelas = this.classes.find(c => c.id === slot.kelas_id);
        const timeBlock = this.timeBlocks.find(tb => tb.id === slot.time_block_id);
        conflicts.push(
          `Time block "${timeBlock?.nama_block}" tidak di-assign ke kelas "${kelas?.nama_kelas}" untuk hari ${slot.hari}`
        );
      }
    }

    return [...new Set(conflicts)];
  }

  public validate(): ValidationResult {
    const errors: string[] = [];

    if (this.teachers.length === 0) {
      errors.push('Tidak ada data guru');
    }

    if (this.classes.length === 0) {
      errors.push('Tidak ada data kelas');
    }

    // ❌ REMOVED: Room validation

    if (this.curriculum.length === 0) {
      errors.push('Tidak ada data kurikulum');
    }

    // ✨ NEW: Validate time blocks assignments
    for (const kelas of this.classes) {
      const hariOperasional = kelas.hari_operasional || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      
      for (const hari of hariOperasional) {
        const availableBlocks = this.getAvailableBlocksForClassAndDay(kelas.id, hari);
        
        if (availableBlocks.length === 0) {
          errors.push(
            `Kelas "${kelas.nama_kelas}" tidak memiliki time blocks untuk hari ${hari}`
          );
        }
      }
    }

    for (const currItem of this.curriculum) {
      if (!currItem.guru_id) {
        errors.push(
          `Mata pelajaran ID ${currItem.mapel_id} di kelas ID ${currItem.kelas_id} belum memiliki guru`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}