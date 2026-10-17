import React from 'react';
import { cn } from '../../lib/utils';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table ref={ref} className={cn('w-full text-xs text-left border-collapse', className)} {...props} />
      </div>
    );
  }
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  return <thead ref={ref} className={cn('bg-stone-50 border-b border-stone-200 text-stone-600', className)} {...props} />;
});
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  return <tbody ref={ref} className={cn('divide-y divide-stone-100', className)} {...props} />;
});
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn('hover:bg-stone-50/70 transition-colors', className)}
        {...props}
      />
    );
  }
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={cn('px-4 py-3 font-semibold text-[11px] text-stone-500 uppercase tracking-wider', className)}
      {...props}
    />
  );
});
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  return <td ref={ref} className={cn('px-4 py-3.5 text-stone-800 align-middle', className)} {...props} />;
});
TableCell.displayName = 'TableCell';
