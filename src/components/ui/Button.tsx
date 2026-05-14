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
        'bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 ' +
        'active:scale-[0.99] active:brightness-95',
      secondary:
        'bg-white text-slate-800 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 ' +
        'active:scale-[0.99]',
      outline:
        'border border-zinc-300 text-emerald-700 bg-white hover:bg-emerald-50/80 hover:border-emerald-200 ' +
        'active:scale-[0.99]',
      ghost: 'text-zinc-700 hover:bg-zinc-100 active:scale-[0.99]',
      danger:
        'bg-rose-600 text-white shadow-sm shadow-rose-900/10 hover:bg-rose-700 ' +
        'active:scale-[0.99]',
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
          'inline-flex items-center justify-center rounded-lg font-medium ' +
            'transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ' +
            'focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50',
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
