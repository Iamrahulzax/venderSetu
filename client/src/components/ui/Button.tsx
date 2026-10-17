import React from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'soft' | 'outline' | 'danger' | 'ghost' | 'campus';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  withArrow?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'soft',
      size = 'md',
      withArrow = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // ChaiUI button styles:
    // solid: crisp white/dark action with asymmetric subtle corner and arrow
    // soft: light grey / warm tint on dark/light
    // outline: mirrors solid asymmetric feel
    // danger: destructive confirmation
    // campus: emerald campus highlight
    const variantStyles = {
      solid:
        'bg-slate-900 text-white hover:bg-slate-800 shadow-sm rounded-xl font-semibold active:scale-[0.98]',
      soft:
        'bg-stone-100/90 text-stone-800 hover:bg-stone-200/80 border border-stone-200/80 rounded-xl font-medium active:scale-[0.98]',
      outline:
        'bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 hover:border-stone-400 rounded-xl font-medium active:scale-[0.98]',
      campus:
        'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm rounded-xl font-semibold active:scale-[0.98]',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 shadow-sm rounded-xl font-semibold active:scale-[0.98]',
      ghost:
        'bg-transparent text-stone-700 hover:bg-stone-100 rounded-xl font-medium'
    };

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-xs font-semibold px-4 py-2 gap-2 h-9',
      lg: 'text-sm font-semibold px-5 py-2.5 gap-2.5 h-11',
      icon: 'p-2 w-9 h-9 justify-center'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
        {children}
        {withArrow && !loading && (
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
