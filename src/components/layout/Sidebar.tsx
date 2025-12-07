import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  DoorOpen,
  Sparkles,
  CalendarCheck,
  LogOut,
} from 'lucide-react';
import { signOut } from '@/lib/supabase';
import type { ViewType } from '@/types';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onSignOut: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  onSignOut,
  isOpen,
  onToggle,
}: SidebarProps) {
  const menuItems = [
    {
      section: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'generator', label: 'Generator', icon: Sparkles },
        { id: 'schedule', label: 'Jadwal', icon: CalendarCheck },
      ],
    },
    {
      section: 'Data Management',
      items: [
        { id: 'teachers', label: 'Guru', icon: Users },
        { id: 'classes', label: 'Kelas', icon: BookOpen },
        { id: 'subjects', label: 'Mata Pelajaran', icon: Calendar },
        { id: 'rooms', label: 'Ruangan', icon: DoorOpen },
      ],
    },
  ];

  return (
    <aside
      className={`
        w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 
        flex flex-col shadow-sm z-30
        transform transition-transform duration-300 ease-in-out

        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-10
      `}
    >
      {/* Brand */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.svg"
            alt="Logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-800">DalilSync</h1>
            <p className="text-xs text-gray-500">Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {menuItems.map((section) => (
          <div key={section.section}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
              {section.section}
            </h3>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id as ViewType);
                      if (window.innerWidth < 768) onToggle();
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                      text-left transition-all duration-200
                      ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    whileHover={{ scale: isActive ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
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
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </motion.button>
      </div>
    </aside>
  );
}
