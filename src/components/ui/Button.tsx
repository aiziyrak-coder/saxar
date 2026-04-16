import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary:
        'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-[0_14px_40px_rgba(52,211,153,0.45)] ' +
        'hover:from-emerald-300 hover:to-emerald-400 active:scale-[0.97]',
      secondary:
        'bg-white/75 text-slate-900 border border-emerald-200/60 backdrop-blur-2xl ' +
        'hover:bg-white/95 active:scale-[0.97]',
      outline:
        'border border-emerald-400/50 text-emerald-600 bg-white/55 backdrop-blur-2xl ' +
        'hover:bg-emerald-400/10 active:scale-[0.97]',
      ghost: 'text-slate-700 hover:bg-emerald-500/10 active:scale-[0.97]',
      danger:
        'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-[0_16px_45px_rgba(248,113,113,0.45)] ' +
        'hover:from-rose-400 hover:to-red-400 active:scale-[0.97]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium ' +
            'transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 ' +
            'focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
