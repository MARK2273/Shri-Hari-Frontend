import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];

  const modalContent = (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#121815]/60 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full ${maxWidthClass} bg-white dark:bg-[#1B2420] border border-[#E5EAE6] dark:border-[#2C3831] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-[#E5EAE6] dark:border-[#2C3831] bg-[#FAFBF9] dark:bg-[#151D19] shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#202B26] dark:text-white leading-snug">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#68746D] dark:text-[#9DAAA2] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 -mr-1 rounded-lg text-[#68746D] hover:text-[#202B26] dark:text-[#9DAAA2] dark:hover:text-white hover:bg-[#EAEFEA] dark:hover:bg-[#25322C] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
