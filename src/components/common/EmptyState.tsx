import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
}) => {
  return (
    <div className="py-12 px-4 text-center border-2 border-dashed border-[#E5EAE6] dark:border-[#2C3831] rounded-xl bg-[#FAFBF9] dark:bg-[#161F1A]">
      <div className="w-12 h-12 mx-auto rounded-xl bg-[#EAF4EF] dark:bg-[#1C2C24] text-[#176B52] dark:text-[#80C6A5] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-[#202B26] dark:text-[#EAEFEA]">
        {title}
      </h3>
      <p className="text-xs text-[#68746D] dark:text-[#9DAAA2] max-w-sm mx-auto mt-1 mb-4">
        {description}
      </p>
      {(actionLabel || secondaryAction) && (
        <div className="flex items-center justify-center gap-2">
          {actionLabel && onAction && (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
