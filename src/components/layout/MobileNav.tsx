import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Sparkles,
  CalendarCheck,
  Menu,
  X,
} from 'lucide-react';
import type { ViewType } from '@/types';

interface MobileNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

type NavItem =
  | { type: 'sidebar' }
  | { type: 'nav'; id: ViewType; label: string; icon: React.ElementType };

const navItems: NavItem[] = [
  { type: 'sidebar' }, // 👈 tombol sidebar
  { type: 'nav', id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { type: 'nav', id: 'generator', label: 'Generator', icon: Sparkles },
  { type: 'nav', id: 'schedule', label: 'Jadwal', icon: CalendarCheck },
];

export default function MobileNav({
  currentView,
  onNavigate,
  isOpen,
  onToggle,
}: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50">
      {navItems.map((item, index) => {
        // Sidebar toggle button
        if (item.type === 'sidebar') {
          return (
            <motion.button
              key={`sidebar-${index}`}
              onClick={onToggle}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-gray-600"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              <span className="text-xs font-medium">
                {isOpen ? 'Tutup' : 'Menu'}
              </span>
            </motion.button>
          );
        }

        // Normal navigation button
        const { id, label, icon: Icon } = item;
        const isActive = currentView === id;

        return (
          <motion.button
            key={id}
            onClick={() => onNavigate(id)}
            whileTap={{ scale: 0.95 }}
            className={`
              flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg
              transition-colors
              ${isActive ? 'text-indigo-600' : 'text-gray-600'}
            `}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
