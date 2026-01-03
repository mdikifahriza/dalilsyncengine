// Re-export all types
export * from './database.types';

// Additional app-specific types
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  role?: string;
}

export interface DashboardStats {
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalRooms: number;
  totalGARuns: number;
  lastRunDate: string;
  successfulRuns: number;
}

export type ViewType = 'dashboard' | 'teachers' | 'classes' | 'subjects' | 'rooms' | 'generator' | 'schedule';