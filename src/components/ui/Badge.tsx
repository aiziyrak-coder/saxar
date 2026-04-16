import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const variants = {
    default: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/25',
    success: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/25',
    warning: 'bg-amber-500/20 text-amber-200 border border-amber-500/25',
    error: 'bg-red-500/20 text-red-200 border border-red-500/25',
    info: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/25',
    neutral: 'bg-white/70 text-slate-700 border border-emerald-200/60',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
