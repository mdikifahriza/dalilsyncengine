import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import type { ViewType } from '@/types';
interface MainLayoutProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  signOut: () => void;
  children: React.ReactNode;
}

export default function MainLayout({
  currentView,
  onNavigate,
  signOut,
  children,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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
      <main className="flex-1 pt-16 pb-16 md:pt-0 md:pb-0">
        {children}
      </main>

      {/* Mobile Navigation (Header + Bottom Nav) */}
      <MobileNav
        currentView={currentView}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />
    </div>
  );
}
