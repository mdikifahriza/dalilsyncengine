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

export default function MobileNav({
  currentView,
  onNavigate,
  isOpen,
  onToggle,
}: MobileNavProps) {
  const mainItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generator', label: 'Generator', icon: Sparkles },
    { id: 'schedule', label: 'Jadwal', icon: CalendarCheck },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center space-x-2">
          <img
            src="/logo.svg"
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="text-lg font-bold text-gray-800">DalilSync</span>
        </div>

        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewType)}
              className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg
                transition-all ${isActive ? 'text-indigo-600' : 'text-gray-600'}
              `}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-600' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
