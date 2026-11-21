import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className?: string }>;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99]';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm sm:text-base px-4 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#176B52] hover:bg-[#12543F] active:bg-[#0D3E2F] text-white border border-[#12543F] focus:ring-[#176B52]/40 shadow-sm',
    secondary:
      'bg-white hover:bg-[#F6F7F5] dark:bg-[#1B2420] dark:hover:bg-[#25322C] text-[#202B26] dark:text-[#EAEFEA] border border-[#E5EAE6] dark:border-[#2E3C34] focus:ring-[#CBD5CD] shadow-sm',
    danger:
      'bg-[#D84C4C] hover:bg-[#BD3E3E] active:bg-[#A33434] text-white border border-transparent focus:ring-[#D84C4C]/40 shadow-sm',
    success:
      'bg-[#21865B] hover:bg-[#1A6C49] active:bg-[#135338] text-white border border-transparent focus:ring-[#21865B]/40 shadow-sm',
    outline:
      'bg-transparent hover:bg-[#EAF4EF] dark:hover:bg-[#1B2420] text-[#176B52] dark:text-[#80C6A5] border border-[#ACCFBF] dark:border-[#2E3C34] focus:ring-[#176B52]/30',
    ghost:
      'bg-transparent hover:bg-[#F6F7F5] dark:hover:bg-[#1B2420] text-[#68746D] dark:text-[#A3B3A9] hover:text-[#202B26] dark:hover:text-white border border-transparent focus:ring-[#CBD5CD]',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
};
