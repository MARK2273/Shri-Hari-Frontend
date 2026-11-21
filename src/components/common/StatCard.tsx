import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  action?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtitle,
  icon: Icon,
  tone = 'default',
  action,
}) => {
  const toneBorder = {
    default: 'border-[#E5EAE6] dark:border-[#26332C]',
    success: 'border-[#BDE0D0] dark:border-[#1E4D36]',
    warning: 'border-[#F6DCAD] dark:border-[#523A17]',
    danger: 'border-[#FACDCD] dark:border-[#542121]',
    info: 'border-[#CDE3F3] dark:border-[#1B4260]',
  }[tone];

  const iconColor = {
    default: 'text-[#176B52] bg-[#EAF4EF] dark:bg-[#152B22] dark:text-[#80C6A5]',
    success: 'text-[#21865B] bg-[#EAF4EF] dark:bg-[#12281E] dark:text-[#67D59E]',
    warning: 'text-[#D99328] bg-[#FEF7EC] dark:bg-[#2A1D0D] dark:text-[#F3BA59]',
    danger: 'text-[#D84C4C] bg-[#FDF2F2] dark:bg-[#2C1313] dark:text-[#F68282]',
    info: 'text-[#4386BD] bg-[#F0F7FC] dark:bg-[#112433] dark:text-[#78B6E4]',
  }[tone];

  return (
    <div
      className={`bg-white dark:bg-[#1B2420] border ${toneBorder} rounded-xl p-4 sm:p-5 shadow-sm transition-colors relative`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#68746D] dark:text-[#9DAAA2]">
          {label}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202B26] dark:text-[#EAEFEA] font-mono">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-[#68746D] dark:text-[#9DAAA2]">
            {unit}
          </span>
        )}
      </div>

      {(subtitle || action) && (
        <div className="mt-2 pt-2 border-t border-[#F2F5F3] dark:border-[#222E27] flex items-center justify-between text-xs text-[#68746D] dark:text-[#9DAAA2]">
          <span>{subtitle}</span>
          {action}
        </div>
      )}
    </div>
  );
};
