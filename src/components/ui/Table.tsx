import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Table Container
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ children, className, ...props }) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-emerald-100', className)} {...props}>
        {children}
      </table>
    </div>
  );
};

// Table Header
interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className, ...props }) => {
  return (
    <thead className={cn('bg-white/70 backdrop-blur-xl border-b border-emerald-100/70', className)} {...props}>
      {children}
    </thead>
  );
};

// Table Body
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className, ...props }) => {
  return (
    <tbody className={cn('divide-y divide-emerald-100 bg-transparent', className)} {...props}>
      {children}
    </tbody>
  );
};

// Table Row
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

export const TableRow: React.FC<TableRowProps> = ({ children, className, ...props }) => {
  return (
    <tr className={cn('hover:bg-emerald-50/50 transition-colors', className)} {...props}>
      {children}
    </tr>
  );
};

// Table Head Cell
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className, ...props }) => {
  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
};

// Table Data Cell
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className, ...props }) => {
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-slate-700', className)} {...props}>
      {children}
    </td>
  );
};

// Table Empty State
interface TableEmptyProps {
  colSpan: number;
  message?: string;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({ colSpan, message = 'Ma\'lumot yo\'q' }) => {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-sm text-slate-500">
        {message}
      </td>
    </tr>
  );
};

// Table Loading State
interface TableLoadingProps {
  colSpan: number;
}

export const TableLoading: React.FC<TableLoadingProps> = ({ colSpan }) => {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        </div>
        <p className="mt-2 text-sm text-slate-400">Yuklanmoqda...</p>
      </td>
    </tr>
  );
};
