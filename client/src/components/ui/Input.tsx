import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full px-3.5 py-2 text-xs text-stone-900 bg-white border border-stone-200 rounded-xl transition-all outline-none placeholder:text-stone-400 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20 disabled:bg-stone-50 disabled:cursor-not-allowed',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error && <span className="text-[11px] text-rose-500 font-medium">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        <textarea
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2 text-xs text-stone-900 bg-white border border-stone-200 rounded-xl transition-all outline-none placeholder:text-stone-400 focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20 disabled:bg-stone-50 disabled:cursor-not-allowed resize-y min-h-[80px]',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error && <span className="text-[11px] text-rose-500 font-medium">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        <select
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2 text-xs text-stone-900 bg-white border border-stone-200 rounded-xl transition-all outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900/20 disabled:bg-stone-50 disabled:cursor-not-allowed cursor-pointer',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-[11px] text-rose-500 font-medium">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <label
      className={cn('text-xs font-semibold text-stone-700 tracking-tight select-none', className)}
      {...props}
    >
      {children}
    </label>
  );
};
