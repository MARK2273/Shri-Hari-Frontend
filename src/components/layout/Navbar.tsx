import React from 'react';
import { Sun, Moon, Bell, Compass, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTour } from '../../context/TourContext';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { openTour } = useTour();

  return (
    <header className="h-16 bg-white dark:bg-[#151D19] border-b border-[#E5EAE6] dark:border-[#26332C] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Open Navigation Menu"
          className="lg:hidden p-2 -ml-1 rounded-lg text-[#4F5D55] dark:text-[#A3B3A9] hover:bg-[#F2F5F3] dark:hover:bg-[#1E2923] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand label visible on mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-md bg-[#176B52] flex items-center justify-center text-white font-bold text-xs shrink-0">
            SH
          </div>
          <span className="font-semibold text-xs text-[#202B26] dark:text-white truncate">
            Shri Hari ERP
          </span>
        </div>

        {/* Industrial measurement badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F6F7F5] dark:bg-[#1B2420] border border-[#E5EAE6] dark:border-[#26332C] text-xs font-medium text-[#4F5D55] dark:text-[#9DAAA2]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#176B52]"></span>
          <span>Standard Weight Unit: <strong>Kilograms (kg)</strong></span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Interactive Tour Guide button */}
        <button
          onClick={() => openTour(0)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#176B52] dark:text-[#80C6A5] bg-[#EAF4EF] dark:bg-[#172B21] border border-[#ACCFBF] dark:border-[#204938] hover:bg-[#D5E8DF] dark:hover:bg-[#203B2E] transition-colors"
          title="Learn how factory modules link together"
        >
          <Compass className="w-3.5 h-3.5 text-[#176B52] dark:text-[#80C6A5] shrink-0" />
          <span className="hidden md:inline">How System Works</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark/Light Mode"
          className="p-2 rounded-lg text-[#68746D] hover:text-[#202B26] dark:text-[#9DAAA2] dark:hover:text-white hover:bg-[#F2F5F3] dark:hover:bg-[#1E2923] transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button
          aria-label="Notifications"
          className="p-2 rounded-lg text-[#68746D] hover:text-[#202B26] dark:text-[#9DAAA2] dark:hover:text-white hover:bg-[#F2F5F3] dark:hover:bg-[#1E2923] transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#176B52]"></span>
        </button>

        <div className="h-5 w-px bg-[#E5EAE6] dark:border-[#26332C] mx-1"></div>

        {/* User preview */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#176B52] text-white font-bold text-xs flex items-center justify-center shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-[#202B26] dark:text-[#EAEFEA] truncate max-w-[130px]">
              {user?.full_name}
            </p>
            <p className="text-[10px] text-[#68746D] dark:text-[#9DAAA2] capitalize truncate max-w-[130px]">
              {user?.role ? user.role.replace(/_/g, ' ') : 'Employee'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
