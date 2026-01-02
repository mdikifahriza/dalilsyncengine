// src/lib/geneticAlgorithm.ts - FIXED: Remove jam_ke field
import type { Teacher, ClassGroup, MapelKelas } from '@/types/database.types';

export interface BlokWaktu {
  id: number;
  kelas_id: number;
  hari: string;
  nama_block: string;
  jam_mulai: string;
  jam_selesai: string;
  urutan: number;
  is_non_jp: boolean;
  is_tetap: boolean;
}

export interface Schedule {
  slots: ScheduleGene[];
  fitness: number;
  conflicts: string[];
}

export interface ScheduleGene {
  kelas_id: number;
  guru_id: number;
  mapel_id: number;
  hari: string;
  blok_waktu_id: number;
}

export interface GAConfig {
  populationSize: number;
  eliteSize: number;
  mutationRate: number;
  crossoverRate: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class GeneticAlgorithm {
  private config: GAConfig;
  private teachers: Teacher[];
  private classes: ClassGroup[];
  private allBlokWaktu: BlokWaktu[];
  private blokWaktuForGA: BlokWaktu[];
  private curriculum: MapelKelas[];
  
  private blokByKelasHari: Map<string, BlokWaktu[]>;

  constructor(
    teachers: Teacher[],
    classes: ClassGroup[],
    allBlokWaktu: BlokWaktu[],
    curriculum: MapelKelas[]
  ) {
    this.config = {
      populationSize: 50,
      eliteSize: 5,
      mutationRate: 0.3,
      crossoverRate: 0.8,
    };
    
    this.teachers = teachers;
    this.classes = classes;
    this.allBlokWaktu = allBlokWaktu;
    this.blokWaktuForGA = allBlokWaktu.filter(b => !b.is_non_jp && !b.is_tetap);
    this.curriculum = curriculum;
    
    this.blokByKelasHari = new Map();
    this.buildCache();
  }

  private buildCache(): void {
    for (const blok of this.blokWaktuForGA) {
      const key = `${blok.kelas_id}-${blok.hari}`;
      if (!this.blokByKelasHari.has(key)) {
        this.blokByKelasHari.set(key, []);
      }
      this.blokByKelasHari.get(key)!.push(blok);
    }
    
    this.blokByKelasHari.forEach(bloks => {
      bloks.sort((a, b) => a.urutan - b.urutan);
    });
  }

  private getAvailableBloks(kelasId: number, hari: string): BlokWaktu[] {
    return this.blokByKelasHari.get(`${kelasId}-${hari}`) || [];
  }

  public validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.teachers.length === 0) errors.push('Tidak ada data guru');
    if (this.classes.length === 0) errors.push('Tidak ada data kelas');
    if (this.curriculum.length === 0) errors.push('Tidak ada data kurikulum');

    const currNoTeacher = this.curriculum.filter(c => !c.guru_id);
    if (currNoTeacher.length > 0) {
      errors.push(`${currNoTeacher.length} mata pelajaran belum punya guru`);
    }

    for (const kelas of this.classes) {
      const hariAktif = kelas.hari_aktif || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      const totalJamKurikulum = this.curriculum
        .filter(c => c.kelas_id === kelas.id)
        .reduce((sum, c) => sum + c.jumlah_jam_per_minggu, 0);

      let totalJPTersedia = 0;
      let totalJPTetap = 0;
      let totalJPBelumDijadwal = 0;
      
      for (const hari of hariAktif) {
        const allJPBloks = this.allBlokWaktu.filter(
          b => b.kelas_id === kelas.id && b.hari === hari && !b.is_non_jp
        );
        
        totalJPTersedia += allJPBloks.length;
        totalJPTetap += allJPBloks.filter(b => b.is_tetap).length;
        totalJPBelumDijadwal += allJPBloks.filter(b => !b.is_tetap).length;
        
        if (allJPBloks.length === 0) {
          warnings.push(`Kelas ${kelas.nama_kelas} tidak punya blok JP di ${hari}`);
        }
      }

      if (totalJPTersedia < totalJamKurikulum) {
        errors.push(
          `Kelas ${kelas.nama_kelas}: Butuh ${totalJamKurikulum} JP, tersedia ${totalJPTersedia} JP ` +
          `(${totalJPTetap} JP Tetap + ${totalJPBelumDijadwal} JP Belum Dijadwal)`
        );
      }

      const remainingJP = totalJamKurikulum - totalJPTetap;
      if (remainingJP > totalJPBelumDijadwal) {
        errors.push(
          `Kelas ${kelas.nama_kelas}: Setelah JP Tetap (${totalJPTetap}), masih butuh ${remainingJP} JP, ` +
          `tapi hanya tersedia ${totalJPBelumDijadwal} slot`
        );
      }

      if (totalJPTersedia > totalJamKurikulum + 5) {
        warnings.push(
          `Kelas ${kelas.nama_kelas}: Blok berlebih (${totalJPTersedia} vs ${totalJamKurikulum} JP)`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  public evolve(onProgress?: (gen: number, best: Schedule) => void): Schedule {
    const MAX_GENERATIONS = 500;
    const TARGET_FITNESS = 100;

    let population = this.initializePopulation();
    let bestEver: Schedule = population[0];
    let noImprovement = 0;

    for (let gen = 0; gen < MAX_GENERATIONS; gen++) {
      population = population.map(schedule => ({
        ...schedule,
        fitness: this.calculateFitness(schedule),
        conflicts: this.detectConflicts(schedule),
      }));

      population.sort((a, b) => b.fitness - a.fitness);

      if (population[0].fitness > bestEver.fitness) {
        bestEver = { ...population[0] };
        noImprovement = 0;
      } else {
        noImprovement++;
      }

      if (onProgress) {
        onProgress(gen + 1, bestEver);
      }

      if (bestEver.fitness >= TARGET_FITNESS) {
        break;
      }

      if (noImprovement > 100) {
        bestEver = this.hillClimbing(bestEver);
        noImprovement = 0;
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

    bestEver = this.hillClimbing(bestEver);

    return bestEver;
  }

  private hillClimbing(schedule: Schedule): Schedule {
    let current = { ...schedule };
    let improved = true;
    let iterations = 0;
    const MAX_ITERATIONS = 100;

    while (improved && iterations < MAX_ITERATIONS) {
      improved = false;
      iterations++;

      for (let i = 0; i < current.slots.length; i++) {
        const original = { ...current.slots[i] };
        const kelas = this.classes.find(k => k.id === original.kelas_id);
        if (!kelas) continue;

        const hariAktif = kelas.hari_aktif || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
        
        for (const hari of hariAktif) {
          const bloks = this.getAvailableBloks(original.kelas_id, hari);
          
          for (const blok of bloks) {
            current.slots[i] = {
              ...original,
              hari: hari,
              blok_waktu_id: blok.id,
            };

            const newFitness = this.calculateFitness(current);
            if (newFitness > schedule.fitness) {
              schedule = { 
                ...current, 
                fitness: newFitness,
                conflicts: this.detectConflicts(current)
              };
              improved = true;
              break;
            }
          }
          
          if (improved) break;
        }

        if (!improved) {
          current.slots[i] = original;
        }
      }
    }

    return schedule;
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
      const kelasCurr = this.curriculum.filter(c => c.kelas_id === kelas.id);
      const hariAktif = kelas.hari_aktif || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

      for (const curr of kelasCurr) {
        const teacher = this.teachers.find(t => t.id === curr.guru_id);
        if (!teacher) continue;

        for (let h = 0; h < curr.jumlah_jam_per_minggu; h++) {
          let attempts = 0;
          let assigned = false;

          while (attempts < 200 && !assigned) {
            const hari = hariAktif[Math.floor(Math.random() * hariAktif.length)];
            const availableBloks = this.getAvailableBloks(kelas.id, hari);
            
            if (availableBloks.length === 0) {
              attempts++;
              continue;
            }

            const blok = availableBloks[Math.floor(Math.random() * availableBloks.length)];
            const slotKey = `${kelas.id}-${hari}-${blok.id}`;

            if (!usedSlots.has(slotKey)) {
              if (teacher.hari_tidak_bisa?.includes(hari)) {
                attempts++;
                continue;
              }

              slots.push({
                kelas_id: kelas.id,
                guru_id: teacher.id,
                mapel_id: curr.mapel_id,
                hari: hari,
                blok_waktu_id: blok.id,
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

  private tournamentSelection(population: Schedule[], size = 5): Schedule {
    const tournament: Schedule[] = [];
    for (let i = 0; i < size; i++) {
      tournament.push(population[Math.floor(Math.random() * population.length)]);
    }
    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  }

  private crossover(p1: Schedule, p2: Schedule): Schedule {
    const point = Math.floor(Math.random() * p1.slots.length);
    return {
      slots: [...p1.slots.slice(0, point), ...p2.slots.slice(point)],
      fitness: 0,
      conflicts: [],
    };
  }

  private mutate(schedule: Schedule): Schedule {
    const slots = [...schedule.slots];
    if (slots.length === 0) return schedule;

    const idx = Math.floor(Math.random() * slots.length);
    const slot = slots[idx];
    const kelas = this.classes.find(k => k.id === slot.kelas_id);
    if (!kelas) return schedule;

    const hariAktif = kelas.hari_aktif || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const hari = hariAktif[Math.floor(Math.random() * hariAktif.length)];
    const bloks = this.getAvailableBloks(slot.kelas_id, hari);
    
    if (bloks.length === 0) return schedule;

    const blok = bloks[Math.floor(Math.random() * bloks.length)];
    slots[idx] = {
      ...slot,
      hari: hari,
      blok_waktu_id: blok.id,
    };

    return { slots, fitness: 0, conflicts: [] };
  }

  private calculateFitness(schedule: Schedule): number {
    let fitness = 100;
    const conflicts = this.detectConflicts(schedule);
    fitness -= conflicts.length * 5;

    for (const kelas of this.classes) {
      const kelasSlots = schedule.slots
        .filter(s => s.kelas_id === kelas.id)
        .sort((a, b) => {
          if (a.hari !== b.hari) return a.hari.localeCompare(b.hari);
          const blokA = this.blokWaktuForGA.find(bl => bl.id === a.blok_waktu_id);
          const blokB = this.blokWaktuForGA.find(bl => bl.id === b.blok_waktu_id);
          return (blokA?.urutan || 0) - (blokB?.urutan || 0);
        });

      let consecutive = 0;
      for (let i = 1; i < kelasSlots.length; i++) {
        if (kelasSlots[i].hari === kelasSlots[i - 1].hari) {
          const blokCurr = this.blokWaktuForGA.find(b => b.id === kelasSlots[i].blok_waktu_id);
          const blokPrev = this.blokWaktuForGA.find(b => b.id === kelasSlots[i - 1].blok_waktu_id);
          if (blokCurr && blokPrev && blokCurr.urutan === blokPrev.urutan + 1) {
            consecutive++;
          }
        }
      }
      fitness += consecutive * 0.5;
    }

    for (const kelas of this.classes) {
      const hariAktif = kelas.hari_aktif || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      const slotsPerDay: { [hari: string]: number } = {};

      hariAktif.forEach(hari => {
        slotsPerDay[hari] = schedule.slots.filter(
          s => s.kelas_id === kelas.id && s.hari === hari
        ).length;
      });

      const avg = Object.values(slotsPerDay).reduce((a, b) => a + b, 0) / hariAktif.length;
      const variance = Object.values(slotsPerDay).reduce(
        (sum, val) => sum + Math.pow(val - avg, 2), 0
      ) / hariAktif.length;

      fitness -= variance * 0.2;
    }

    return Math.max(0, fitness);
  }

  private detectConflicts(schedule: Schedule): string[] {
    const conflicts: string[] = [];

    const teacherSlots: { [key: string]: ScheduleGene[] } = {};
    for (const slot of schedule.slots) {
      const key = `${slot.guru_id}-${slot.hari}-${slot.blok_waktu_id}`;
      if (!teacherSlots[key]) teacherSlots[key] = [];
      teacherSlots[key].push(slot);

      if (teacherSlots[key].length > 1) {
        const teacher = this.teachers.find(t => t.id === slot.guru_id);
        const blok = this.blokWaktuForGA.find(b => b.id === slot.blok_waktu_id);
        conflicts.push(
          `Guru ${teacher?.nama} mengajar ${teacherSlots[key].length} kelas di ${slot.hari} ${blok?.nama_block}`
        );
      }
    }

    const classSlots: { [key: string]: ScheduleGene[] } = {};
    for (const slot of schedule.slots) {
      const key = `${slot.kelas_id}-${slot.hari}-${slot.blok_waktu_id}`;
      if (!classSlots[key]) classSlots[key] = [];
      classSlots[key].push(slot);

      if (classSlots[key].length > 1) {
        const kelas = this.classes.find(k => k.id === slot.kelas_id);
        const blok = this.blokWaktuForGA.find(b => b.id === slot.blok_waktu_id);
        conflicts.push(
          `Kelas ${kelas?.nama_kelas} punya ${classSlots[key].length} mapel di ${slot.hari} ${blok?.nama_block}`
        );
      }
    }

    const teacherHours: { [id: number]: number } = {};
    for (const slot of schedule.slots) {
      teacherHours[slot.guru_id] = (teacherHours[slot.guru_id] || 0) + 1;
    }

    for (const teacherId in teacherHours) {
      const teacher = this.teachers.find(t => t.id === Number(teacherId));
      if (teacher && teacherHours[teacherId] > teacher.jam_maks) {
        conflicts.push(
          `Guru ${teacher.nama} melebihi jam maks (${teacherHours[teacherId]}/${teacher.jam_maks})`
        );
      }
    }

    return [...new Set(conflicts)];
  }
}