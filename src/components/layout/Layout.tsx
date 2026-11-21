import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { useTour } from '../../context/TourContext';
import { WorkflowTourModal } from '../common/WorkflowTourModal';

export const Layout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isTourOpen, closeTour, initialStep } = useTour();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar automatically on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F7F5] dark:bg-[#111714]">
        <div className="w-8 h-8 border-3 border-[#176B52] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F6F7F5] dark:bg-[#111714] text-[#202B26] dark:text-[#EAEFEA] transition-colors">
      <Sidebar isMobileOpen={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
      <WorkflowTourModal isOpen={isTourOpen} onClose={closeTour} initialStep={initialStep} />
    </div>
  );
};
