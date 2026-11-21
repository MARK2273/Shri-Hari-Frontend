import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-[#EAF4EF] text-[#12543F] border-[#ACCFBF] dark:bg-[#152B22] dark:text-[#80C6A5] dark:border-[#204938]',
    success: 'bg-[#EAF4EF] text-[#1E744F] border-[#BDE0D0] dark:bg-[#12281E] dark:text-[#67D59E] dark:border-[#1E4D36]',
    warning: 'bg-[#FEF7EC] text-[#975E10] border-[#F6DCAD] dark:bg-[#2A1D0D] dark:text-[#F3BA59] dark:border-[#523A17]',
    danger: 'bg-[#FDF2F2] text-[#A62828] border-[#FACDCD] dark:bg-[#2C1313] dark:text-[#F68282] dark:border-[#542121]',
    info: 'bg-[#F0F7FC] text-[#245D87] border-[#CDE3F3] dark:bg-[#112433] dark:text-[#78B6E4] dark:border-[#1B4260]',
    neutral: 'bg-[#F2F5F3] text-[#4F5D55] border-[#DCE3DF] dark:bg-[#1D2521] dark:text-[#A3B3A9] dark:border-[#2E3C34]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] leading-tight font-semibold rounded-md',
    md: 'px-2.5 py-1 text-xs leading-tight font-semibold rounded-md',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border ${variantStyles[variant]} ${sizeStyles[size]} tracking-tight ${className}`}
    >
      {children}
    </span>
  );
};
