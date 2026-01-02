import { useState, type PropsWithChildren } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import type { ViewType } from '@/types';

interface MainLayoutProps extends PropsWithChildren {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export default function MainLayout({
  currentView,
  onNavigate,
  children,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentView={currentView}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />
    </div>
  );
}
