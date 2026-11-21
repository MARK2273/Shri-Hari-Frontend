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
  X,
  Workflow,
  Recycle,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTour } from '../../context/TourContext';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { openTour } = useTour();

  const navSections: NavSection[] = [
    {
      title: 'FACTORY',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'INVENTORY',
      items: [
        { name: 'Raw Materials & Batches', href: '/materials', icon: Layers },
        { name: 'Finished Goods', href: '/finished-goods', icon: PackageCheck },
        { name: 'Scrap & Waste Sales', href: '/scrap', icon: Recycle },
      ],
    },
    {
      title: 'BUSINESS',
      items: [
        { name: 'Customer Orders', href: '/orders', icon: ShoppingCart },
        { name: 'Products & Recipes', href: '/products', icon: FlaskConical },
        { name: 'Job Work (Outsource)', href: '/job-work', icon: Workflow },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Production Runs', href: '/production', icon: Factory },
        { name: 'Dispatch & Delivery', href: '/dispatch', icon: Truck },
        { name: 'Full Traceability', href: '/traceability', icon: GitBranch },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { name: 'Variance & Reports', href: '/reports', icon: BarChart3 },
      ],
    },
  ];

  const renderContent = (isMobileView = false) => (
    <div className="flex flex-col h-full bg-[#FFFFFF] dark:bg-[#151D19] border-r border-[#E5EAE6] dark:border-[#26332C]">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#E5EAE6] dark:border-[#26332C] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#176B52] flex items-center justify-center text-white font-bold text-sm tracking-tight shrink-0 shadow-sm">
            SH
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm text-[#202B26] dark:text-[#EAEFEA] truncate leading-tight">
              Shri Hari Packaging
            </h1>
            <span className="text-[11px] font-medium text-[#68746D] dark:text-[#9DAAA2] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#21865B]"></span>
              Factory ERP
            </span>
          </div>
        </div>

        {isMobileView && (
          <button
            onClick={onCloseMobile}
            aria-label="Close Navigation"
            className="p-1.5 rounded-lg text-[#68746D] hover:text-[#202B26] dark:text-[#9DAAA2] dark:hover:text-white hover:bg-[#F2F5F3] dark:hover:bg-[#1E2923] transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Current Factory / Tenant Card */}
      <div className="mx-3.5 my-3 px-3 py-2 rounded-lg bg-[#F6F7F5] dark:bg-[#1B2420] border border-[#E5EAE6] dark:border-[#26332C] flex items-center gap-2.5 shrink-0">
        <Building2 className="w-4 h-4 text-[#176B52] dark:text-[#80C6A5] shrink-0" />
        <div className="truncate">
          <p className="text-[10px] font-semibold tracking-wider uppercase text-[#68746D] dark:text-[#9DAAA2]">
            Factory Unit
          </p>
          <p className="text-xs font-semibold text-[#202B26] dark:text-[#EAEFEA] truncate">
            {user?.tenant_name || 'Shri Hari Packaging Plant'}
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-1 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#8A9790] dark:text-[#76847C] uppercase">
              {section.title}
            </div>
            {section.items.map((item) => {
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
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#176B52] text-white font-semibold shadow-sm'
                        : 'text-[#4F5D55] dark:text-[#A3B3A9] hover:text-[#202B26] dark:hover:text-white hover:bg-[#F2F5F3] dark:hover:bg-[#1E2923]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Guided Tour Launcher in Sidebar */}
      <div className="px-3.5 pb-2 shrink-0">
        <button
          onClick={() => {
            openTour(0);
            if (isMobileView && onCloseMobile) {
              onCloseMobile();
            }
          }}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#176B52] dark:text-[#80C6A5] bg-[#EAF4EF] dark:bg-[#172B21] hover:bg-[#D5E8DF] dark:hover:bg-[#203B2E] transition-colors"
        >
          <Compass className="w-4 h-4 text-[#176B52] dark:text-[#80C6A5] shrink-0" />
          <span className="truncate">Workflow Guide</span>
        </button>
      </div>

      {/* User Information & Sign Out */}
      <div className="p-3.5 border-t border-[#E5EAE6] dark:border-[#26332C] bg-[#FAFBF9] dark:bg-[#131B17] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#176B52] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-[#202B26] dark:text-[#EAEFEA] truncate">
                {user?.full_name || 'Factory Employee'}
              </p>
              <p className="text-[10px] text-[#68746D] dark:text-[#9DAAA2] capitalize truncate">
                {user?.role ? user.role.replace(/_/g, ' ') : 'Operator'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out of ERP"
            aria-label="Sign out"
            className="p-1.5 rounded-lg text-[#68746D] hover:text-[#D84C4C] dark:text-[#9DAAA2] dark:hover:text-[#F68282] hover:bg-[#FDF2F2] dark:hover:bg-[#2A1313] transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (sticky, visible on lg and up) */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-20">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#121815]/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-64 max-w-[85vw] h-full shadow-xl z-10 animate-fade-in">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
