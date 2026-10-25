import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  FlaskConical,
  ShoppingCart,
  Factory,
  PackageCheck,
  Truck,
  GitBranch,
  BarChart3,
  LogOut,
  Building2,
  Compass,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTour } from '../../context/TourContext';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { openTour } = useTour();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Raw Materials & Batches', href: '/materials', icon: Layers },
    { name: 'Products & Recipes', href: '/products', icon: FlaskConical },
    { name: 'Customer Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Production Runs', href: '/production', icon: Factory },
    { name: 'Finished Goods', href: '/finished-goods', icon: PackageCheck },
    { name: 'Dispatch & Delivery', href: '/dispatch', icon: Truck },
    { name: 'Full Traceability', href: '/traceability', icon: GitBranch },
    { name: 'Variance & Reports', href: '/reports', icon: BarChart3 },
  ];

  const renderContent = (isMobileView = false) => (
    <>
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 font-extrabold text-lg shrink-0">
            SH
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
              Shri Hari Packaging
            </h1>
            <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Manufacturing ERP
            </span>
          </div>
        </div>

        {isMobileView && (
          <button
            onClick={onCloseMobile}
            aria-label="Close Navigation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-factory-800 transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tenant Indicator */}
      <div className="mx-3 sm:mx-4 my-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-factory-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2.5 shrink-0">
        <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
        <div className="truncate">
          <p className="text-[10px] uppercase font-bold text-slate-400">Current Factory</p>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
            {user?.tenant_name || 'Shri Hari Factory'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => {
                if (isMobileView && onCloseMobile) {
                  onCloseMobile();
                }
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${isActive
                  ? 'bg-brand-500 text-white font-semibold shadow-sm shadow-brand-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-factory-800/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Guided Tour Launcher in Sidebar */}
      {/* <div className="px-3 pb-3 shrink-0">
        <button
          onClick={() => {
            openTour(0);
            if (isMobileView && onCloseMobile) {
              onCloseMobile();
            }
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 transition-all hover:scale-[1.01]"
        >
          <Compass className="w-4 h-4 text-brand-500" />
          <span className="truncate">Factory Workflow Tour</span>
        </button>
      </div> */}

      {/* User Card & Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-factory-950/30 shrink-0">
        {/* <div className="flex items-center justify-between mb-3">
          <div className="truncate">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div> */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (sticky, visible on lg and up) */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-factory-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 h-screen sticky top-0 transition-colors z-20">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-out Panel */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-factory-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl z-10 animate-fade-in">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
