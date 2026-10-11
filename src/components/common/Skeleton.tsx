import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-factory-800/70 rounded-lg ${className}`}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-factory-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm ${className}`}>
      {/* Table Header Skeleton */}
      <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-factory-950/60 border-b border-slate-200/80 dark:border-slate-800">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-5 py-3">
                  <Skeleton className="h-3.5 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-factory-800/20">
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <td key={cIdx} className="px-5 py-3.5">
                    <Skeleton
                      className={`h-4 ${
                        cIdx === 0
                          ? 'w-28'
                          : cIdx === 1
                          ? 'w-36'
                          : cIdx === columns - 1
                          ? 'w-16 rounded-full'
                          : 'w-20'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SkeletonPageHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52 sm:w-64" />
        <Skeleton className="h-3.5 w-64 sm:w-96" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
    </div>
  );
};

export const SkeletonFilterBar: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Skeleton className="h-9 w-full sm:w-64 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
};

interface PageSkeletonProps {
  type?: 'dashboard' | 'table' | 'cards' | 'traceability' | 'reports';
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ type = 'table' }) => {
  if (type === 'dashboard') {
    return (
      <div className="space-y-6">
        <SkeletonPageHeader />
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonTable rows={4} columns={4} />
          <SkeletonTable rows={4} columns={4} />
        </div>
      </div>
    );
  }

  if (type === 'reports') {
    return (
      <div className="space-y-6">
        <SkeletonPageHeader />
        {/* Tabs skeleton */}
        <div className="flex gap-2 pb-1">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        {/* KPI summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable rows={6} columns={5} />
      </div>
    );
  }

  if (type === 'traceability') {
    return (
      <div className="space-y-6">
        <SkeletonPageHeader />
        <div className="p-5 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-factory-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Default 'table' type
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <SkeletonFilterBar />
      <SkeletonTable rows={6} columns={5} />
    </div>
  );
};
