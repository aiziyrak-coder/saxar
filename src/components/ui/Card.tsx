import React from 'react';
import { cn } from './Button';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-3xl border border-emerald-200/60 bg-white/75 backdrop-blur-2xl p-6 ' +
          'shadow-[0_18px_60px_rgba(16,185,129,0.12)] ' +
          'transition-transform transition-shadow duration-300 ' +
          'hover:-translate-y-1 hover:shadow-[0_22px_80px_rgba(16,185,129,0.18)]',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';
