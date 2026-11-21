import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  actions,
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#1B2420] border border-[#E5EAE6] dark:border-[#26332C] rounded-xl shadow-sm ${className}`}
    >
      {(title || actions) && (
        <div className="px-5 py-4 border-b border-[#E5EAE6] dark:border-[#26332C] flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#202B26] dark:text-[#EAEFEA]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#68746D] dark:text-[#9DAAA2] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-5'}>{children}</div>
    </div>
  );
};
