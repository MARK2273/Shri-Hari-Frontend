import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface AlertBannerProps {
  title: string;
  description?: React.ReactNode;
  variant?: 'warning' | 'danger' | 'info' | 'success';
  action?: React.ReactNode;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  title,
  description,
  variant = 'warning',
  action,
  className = '',
}) => {
  const styles = {
    warning: {
      container: 'bg-[#FEF7EC] border-[#F6DCAD] text-[#975E10] dark:bg-[#251A0C] dark:border-[#4B3415] dark:text-[#F3BA59]',
      icon: AlertTriangle,
      iconColor: 'text-[#D99328]',
    },
    danger: {
      container: 'bg-[#FDF2F2] border-[#FACDCD] text-[#A62828] dark:bg-[#2A1212] dark:border-[#4E1E1E] dark:text-[#F68282]',
      icon: AlertCircle,
      iconColor: 'text-[#D84C4C]',
    },
    info: {
      container: 'bg-[#F0F7FC] border-[#CDE3F3] text-[#245D87] dark:bg-[#10212E] dark:border-[#193C57] dark:text-[#78B6E4]',
      icon: Info,
      iconColor: 'text-[#4386BD]',
    },
    success: {
      container: 'bg-[#EAF4EF] border-[#BDE0D0] text-[#1E744F] dark:bg-[#10241A] dark:border-[#1B4630] dark:text-[#67D59E]',
      icon: CheckCircle2,
      iconColor: 'text-[#21865B]',
    },
  }[variant];

  const IconComponent = styles.icon;

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl border flex items-start justify-between gap-3 ${styles.container} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${styles.iconColor}`} />
        <div>
          <h4 className="text-xs sm:text-sm font-semibold leading-snug">
            {title}
          </h4>
          {description && (
            <div className="text-xs opacity-90 mt-0.5 leading-relaxed">
              {description}
            </div>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
