// src/lib/geneticAlgorithm.ts - UPDATED untuk Time Blocks & Curriculum
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
  time_block_id: number; // UPDATED: sekarang wajib
  jam_ke?: number; // OPTIONAL: untuk backward compatibility
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
  private timeBlocks: TimeBlock[]; // BARU
  private curriculum: MapelKelas[]; // BARU: ganti subjects

  constructor(
    config: GAConfig,
    teachers: Teacher[],
    classes: ClassGroup[],
    rooms: Room[],
    timeBlocks: TimeBlock[], // BARU
    curriculum: MapelKelas[] // BARU
  ) {
    this.config = config;
    this.teachers = teachers;
    this.classes = classes;
    this.rooms = rooms;
    this.timeBlocks = timeBlocks.filter(tb => tb.tipe_block === 'lesson' && !tb.is_fixed);
    this.curriculum = curriculum;
  }

  /**
   * Main evolution loop
   */
  public evolve(onProgress?: (gen: number, best: Schedule) => void): Schedule {
    // Initialize population
    let population = this.initializePopulation();

    let bestEver: Schedule = population[0];

    // Evolution loop
    for (let gen = 0; gen < this.config.maxGenerations; gen++) {
      // Evaluate fitness
      population = population.map(schedule => ({
        ...schedule,
        fitness: this.calculateFitness(schedule),
        conflicts: this.detectConflicts(schedule),
      }));

      // Sort by fitness (descending)
      population.sort((a, b) => b.fitness - a.fitness);

      // Update best
      if (population[0].fitness > bestEver.fitness) {
        bestEver = { ...population[0] };
      }

      // Callback for progress
      if (onProgress) {
        onProgress(gen + 1, bestEver);
      }

      // Create new generation
      const newPopulation: Schedule[] = [];

      // Elitism: Keep best schedules
      for (let i = 0; i < this.config.eliteSize; i++) {
        newPopulation.push({ ...population[i] });
      }

      // Fill rest with offspring
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

  /**
   * Initialize random population
   */
  private initializePopulation(): Schedule[] {
    const population: Schedule[] = [];

    for (let i = 0; i < this.config.populationSize; i++) {
      const schedule = this.createRandomSchedule();
      population.push(schedule);
    }

    return population;
  }

  /**
   * Create one random schedule - UPDATED untuk Time Blocks
   */
  private createRandomSchedule(): Schedule {
    const slots: ScheduleGene[] = [];

    // UPDATED: Loop per kelas, bukan per subject global
    for (const kelas of this.classes) {
      const usedSlots = new Set<string>();
      
      // Get curriculum untuk kelas ini
      const kelasCurriculum = this.curriculum.filter(c => c.kelas_id === kelas.id);

      for (const currItem of kelasCurriculum) {
        const teacher = this.teachers.find(t => t.id === currItem.guru_id);
        if (!teacher) continue;

        const hoursNeeded = currItem.jumlah_jam_per_minggu;

        for (let h = 0; h < hoursNeeded; h++) {
          let attempts = 0;
          let assigned = false;

          while (attempts < 200 && !assigned) {
            // UPDATED: Pilih time block random
            const availableBlocks = this.getAvailableBlocks(kelas);
            if (availableBlocks.length === 0) break;

            const timeBlock = availableBlocks[Math.floor(Math.random() * availableBlocks.length)];
            
            // Generate hari based on hari_operasional kelas
            const hariOperasional = kelas.hari_operasional || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            const hari = hariOperasional[Math.floor(Math.random() * hariOperasional.length)];

            // Check jika time block berlaku di hari ini
            if (timeBlock.hari_berlaku && timeBlock.hari_berlaku.length > 0) {
              if (!timeBlock.hari_berlaku.includes(hari)) {
                attempts++;
                continue;
              }
            }

            const slotKey = `${kelas.id}-${hari}-${timeBlock.id}`;

            if (!usedSlots.has(slotKey)) {
              // Check teacher availability
              if (teacher.hari_tidak_bisa && teacher.hari_tidak_bisa.includes(hari)) {
                attempts++;
                continue;
              }

              // Select room
              let room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
              
              // Check for special room requirement
              const mapel = this.curriculum.find(c => c.mapel_id === currItem.mapel_id);
              if (mapel?.mapel?.ruang_khusus) {
                const specialRoom = this.rooms.find(r =>
                  r.nama_ruang.toLowerCase().includes(mapel.mapel.ruang_khusus!.toLowerCase())
                );
                if (specialRoom) room = specialRoom;
              }

              // Check if kelas has default room
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
                jam_ke: timeBlock.urutan, // untuk backward compatibility
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
   * Get available time blocks for a class
   */
  private getAvailableBlocks(kelas: ClassGroup): TimeBlock[] {
    return this.timeBlocks.filter(tb => {
      // Filter by jam_mulai and jam_selesai of class
      if (kelas.jam_mulai && kelas.jam_selesai) {
        const blockStart = tb.jam_mulai;
        const blockEnd = tb.jam_selesai;
        return blockStart >= kelas.jam_mulai && blockEnd <= kelas.jam_selesai;
      }
      return true;
    });
  }

  /**
   * Tournament selection
   */
  private tournamentSelection(population: Schedule[], tournamentSize = 5): Schedule {
    const tournament: Schedule[] = [];

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }

    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  }

  /**
   * One-point crossover
   */
  private crossover(parent1: Schedule, parent2: Schedule): Schedule {
    const cutPoint = Math.floor(Math.random() * parent1.slots.length);

    const childSlots = [
      ...parent1.slots.slice(0, cutPoint),
      ...parent2.slots.slice(cutPoint),
    ];

    return { slots: childSlots, fitness: 0, conflicts: [] };
  }

  /**
   * Mutation operator - UPDATED untuk Time Blocks
   */
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
          // Change time block
          const kelas = this.classes.find(c => c.id === slot.kelas_id);
          const availableBlocks = kelas ? this.getAvailableBlocks(kelas) : this.timeBlocks;
          const newBlock = availableBlocks[Math.floor(Math.random() * availableBlocks.length)];
          return {
            ...slot,
            time_block_id: newBlock.id,
            jam_ke: newBlock.urutan,
          };
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
   * Calculate fitness score (0-100) - UPDATED
   */
  private calculateFitness(schedule: Schedule): number {
    let score = 100;

    // 1. Teacher conflicts (same teacher, same time)
    const teacherMap = new Map<string, number>();
    schedule.slots.forEach(slot => {
      const key = `${slot.guru_id}-${slot.hari}-${slot.time_block_id}`;
      teacherMap.set(key, (teacherMap.get(key) || 0) + 1);
    });

    teacherMap.forEach(count => {
      if (count > 1) {
        score -= (count - 1) * 15; // Heavy penalty
      }
    });

    // 2. Room conflicts (same room, same time)
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

    // 3. Class conflicts (same class, same time)
    const classMap = new Map<string, number>();
    schedule.slots.forEach(slot => {
      const key = `${slot.kelas_id}-${slot.hari}-${slot.time_block_id}`;
      classMap.set(key, (classMap.get(key) || 0) + 1);
    });

    classMap.forEach(count => {
      if (count > 1) {
        score -= (count - 1) * 20; // Very heavy penalty
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
   * Detect all conflicts - UPDATED
   */
  private detectConflicts(schedule: Schedule): string[] {
    const conflicts: string[] = [];

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
   * Validate schedule - UPDATED
   */
  public validate(schedule: Schedule): ValidationResult {
    const errors: string[] = [];

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