// src/components/layout/Sidebar.tsx
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  DoorOpen,
  Sparkles,
  CalendarCheck,
  Clock,
  BookMarked,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from '@/lib/supabase';
import type { ViewType } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useSchoolProfile } from '@/hooks/useSchoolProfile';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

type MenuSection = {
  section: string;
  items: Array<{
    id: ViewType;
    label: string;
    icon: React.ElementType;
  }>;
};

const menuItems: MenuSection[] = [
  {
    section: 'Utama',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'generator', label: 'Buat Jadwal', icon: Sparkles },
      { id: 'schedule', label: 'Lihat Jadwal', icon: CalendarCheck },
    ],
  },
  {
    section: 'Penjadwalan',
    items: [
      { id: 'time-blocks', label: 'Blok Waktu', icon: Clock },
    ],
  },
  {
    section: 'Kurikulum',
    items: [
      { id: 'curriculum', label: 'Kurikulum Kelas', icon: BookMarked },
      { id: 'subjects', label: 'Mata Pelajaran', icon: Calendar },
    ],
  },
  {
    section: 'Data Master',
    items: [
      { id: 'teachers', label: 'Guru', icon: Users },
      { id: 'classes', label: 'Kelas', icon: BookOpen },
      { id: 'rooms', label: 'Ruangan', icon: DoorOpen },
    ],
  },
];

export default function Sidebar({
  currentView,
  onNavigate,
  isOpen,
  onToggle,
}: SidebarProps) {
  const { user } = useAuth();
  const { data: school } = useSchoolProfile(user?.id);

  return (
    <aside
      className={`
        w-64 bg-white border-r border-gray-200 h-screen fixed inset-y-0 left-0
        flex flex-col z-30
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-10
      `}
    >
      {/* School Identity */}
      <div
        onClick={() => {
          onNavigate('school-settings');
          if (window.innerWidth < 768) onToggle();
        }}
        className="px-6 py-5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
      >
        <h1 className="text-base font-semibold text-gray-800 truncate">
          {school?.nama_sekolah ?? 'Sekolah'}
        </h1>
        <p className="text-xs text-gray-500">
          {school?.jenjang ?? 'Profil Sekolah'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {menuItems.map(({ section, items }) => (
          <div key={section}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
              {section}
            </h3>

            <div className="space-y-1">
              {items.map(({ id, label, icon: Icon }) => {
                const isActive = currentView === id;

                return (
                  <motion.button
                    key={id}
                    onClick={() => {
                      onNavigate(id);
                      if (window.innerWidth < 768) onToggle();
                    }}
                    whileHover={{ scale: isActive ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      text-left transition-all duration-200
                      ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <motion.button
          onClick={() => {
            signOut();
            if (window.innerWidth < 768) onToggle();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                     text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </motion.button>
      </div>
    </aside>
  );
}
