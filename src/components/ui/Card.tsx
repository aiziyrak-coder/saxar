import React from 'react';
import { cn } from './Button';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm ' +
          'transition-shadow duration-200 hover:shadow-md ' +
          'dark:border-slate-700 dark:bg-slate-900',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';
