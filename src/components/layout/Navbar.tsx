import React from 'react';
import { Sun, Moon, Bell, ShieldCheck, Compass } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTour } from '../../context/TourContext';

export const Navbar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { openTour } = useTour();

  return (
    <header className="h-16 bg-white dark:bg-factory-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-white/90 dark:bg-factory-900/90 transition-colors">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Supabase RLS Protected
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">| Standard Unit: Kilograms (kg)</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => openTour(0)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 transition-all hover:scale-105 shadow-sm"
          title="Interactive Tour: Learn how things are co-related in this ERP"
        >
          <Compass className="w-4 h-4 text-brand-500" />
          <span className="hidden sm:inline">Interactive Tour</span>
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark/Light Mode"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-factory-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          aria-label="Notifications"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-factory-800 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:border-slate-800 mx-1"></div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
