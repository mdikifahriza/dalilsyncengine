// src/lib/geneticAlgorithm.ts
// Pure GA logic - No React dependencies

import type { Teacher, Subject, ClassGroup, Room } from '@/types/database.types';

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
  jam_ke: number;
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

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const HOURS_PER_DAY = 8;

export class GeneticAlgorithm {
  private config: GAConfig;
  private teachers: Teacher[];
  private classes: ClassGroup[];
  private subjects: Subject[];
  private rooms: Room[];

  constructor(
    config: GAConfig,
    teachers: Teacher[],
    classes: ClassGroup[],
    subjects: Subject[],
    rooms: Room[]
  ) {
    this.config = config;
    this.teachers = teachers;
    this.classes = classes;
    this.subjects = subjects;
    this.rooms = rooms;
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
        // Selection
        const parent1 = this.tournamentSelection(population);
        const parent2 = this.tournamentSelection(population);

        // Crossover
        let child: Schedule;
        if (Math.random() < this.config.crossoverRate) {
          child = this.crossover(parent1, parent2);
        } else {
          child = { ...parent1 };
        }

        // Mutation
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
   * Create one random schedule
   */
  private createRandomSchedule(): Schedule {
    const slots: ScheduleGene[] = [];

    for (const kelas of this.classes) {
      const usedSlots = new Set<string>();

      for (const subject of this.subjects) {
        const hoursNeeded = subject.jumlah_jam_per_minggu;
        const teacher = this.teachers.find(t => t.mapel_id === subject.id);

        if (!teacher) continue;

        for (let h = 0; h < hoursNeeded; h++) {
          let attempts = 0;
          let assigned = false;

          while (attempts < 200 && !assigned) {
            const day = DAYS[Math.floor(Math.random() * DAYS.length)];
            const hour = Math.floor(Math.random() * HOURS_PER_DAY) + 1;
            const slotKey = `${kelas.id}-${day}-${hour}`;

            if (!usedSlots.has(slotKey)) {
              // Check teacher availability
              if (teacher.hari_tidak_bisa && teacher.hari_tidak_bisa.includes(day)) {
                attempts++;
                continue;
              }

              // Select room
              let room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
              if (subject.ruang_khusus) {
                const specialRoom = this.rooms.find(r =>
                  r.nama_ruang.toLowerCase().includes(subject.ruang_khusus!.toLowerCase())
                );
                if (specialRoom) room = specialRoom;
              }

              slots.push({
                kelas_id: kelas.id,
                guru_id: teacher.id,
                mapel_id: subject.id,
                ruang_id: room.id,
                hari: day,
                jam_ke: hour,
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
   * Mutation operator
   */
  private mutate(schedule: Schedule): Schedule {
    const mutatedSlots = schedule.slots.map(slot => {
      if (Math.random() < 0.1) {
        // 10% chance to mutate each gene
        const mutationType = Math.random();

        if (mutationType < 0.33) {
          // Change day
          return { ...slot, hari: DAYS[Math.floor(Math.random() * DAYS.length)] };
        } else if (mutationType < 0.66) {
          // Change hour
          return { ...slot, jam_ke: Math.floor(Math.random() * HOURS_PER_DAY) + 1 };
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
   * Calculate fitness score (0-100)
   */
  private calculateFitness(schedule: Schedule): number {
    let score = 100;

    // 1. Teacher conflicts (same teacher, same time)
    const teacherMap = new Map<string, number>();
    schedule.slots.forEach(slot => {
      const key = `${slot.guru_id}-${slot.hari}-${slot.jam_ke}`;
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
      const key = `${slot.ruang_id}-${slot.hari}-${slot.jam_ke}`;
      roomMap.set(key, (roomMap.get(key) || 0) + 1);
    });

    roomMap.forEach(count => {
      if (count > 1) {
        score -= (count - 1) * 15;
      }
    });

    // 3. Class conflicts (same class, same time, multiple subjects)
    const classMap = new Map<string, number>();
    schedule.slots.forEach(slot => {
      const key = `${slot.kelas_id}-${slot.hari}-${slot.jam_ke}`;
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

    const avgPerDay = schedule.slots.length / DAYS.length;
    dayDistribution.forEach(count => {
      const deviation = Math.abs(count - avgPerDay);
      score -= deviation * 0.2;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect all conflicts
   */
  private detectConflicts(schedule: Schedule): string[] {
    const conflicts: string[] = [];

    // Teacher conflicts
    const teacherMap = new Map<string, ScheduleGene[]>();
    schedule.slots.forEach(slot => {
      const key = `${slot.guru_id}-${slot.hari}-${slot.jam_ke}`;
      if (!teacherMap.has(key)) teacherMap.set(key, []);
      teacherMap.get(key)!.push(slot);
    });

    teacherMap.forEach((slots, key) => {
      if (slots.length > 1) {
        const teacher = this.teachers.find(t => t.id === slots[0].guru_id);
        conflicts.push(`Guru ${teacher?.nama} mengajar ${slots.length} kelas pada ${key}`);
      }
    });

    // Room conflicts
    const roomMap = new Map<string, ScheduleGene[]>();
    schedule.slots.forEach(slot => {
      const key = `${slot.ruang_id}-${slot.hari}-${slot.jam_ke}`;
      if (!roomMap.has(key)) roomMap.set(key, []);
      roomMap.get(key)!.push(slot);
    });

    roomMap.forEach((slots, key) => {
      if (slots.length > 1) {
        const room = this.rooms.find(r => r.id === slots[0].ruang_id);
        conflicts.push(`Ruang ${room?.nama_ruang} digunakan ${slots.length} kelas pada ${key}`);
      }
    });

    return conflicts;
  }

  /**
   * Validate schedule
   */
  public validate(schedule: Schedule): ValidationResult {
    const errors: string[] = [];

    // Check subject hours requirement
    const subjectHours = new Map<number, number>();
    schedule.slots.forEach(slot => {
      subjectHours.set(slot.mapel_id, (subjectHours.get(slot.mapel_id) || 0) + 1);
    });

    this.subjects.forEach(subject => {
      const hours = subjectHours.get(subject.id) || 0;
      const required = subject.jumlah_jam_per_minggu * this.classes.length;
      if (hours !== required) {
        errors.push(
          `Mapel ${subject.nama_mapel}: ${hours} jam (seharusnya ${required})`
        );
      }
    });

    // Check conflicts
    const conflicts = this.detectConflicts(schedule);
    errors.push(...conflicts);

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}