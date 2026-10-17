import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'soft'
    | 'solid'
    | 'outline'
    | 'hot'
    | 'new'
    | 'bestseller'
    | 'inStock'
    | 'lowStock'
    | 'outOfStock';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-stone-900/90 text-white backdrop-blur-sm',
      soft: 'bg-stone-100 text-stone-800 border border-stone-200/80',
      solid: 'bg-stone-900 text-white',
      outline: 'bg-white/95 text-stone-800 border border-stone-200 backdrop-blur-sm',
      hot: 'bg-amber-500 text-white font-bold',
      new: 'bg-blue-600 text-white font-bold',
      bestseller: 'bg-purple-600 text-white font-bold',
      inStock: 'bg-emerald-600 text-white',
      lowStock: 'bg-amber-500 text-white',
      outOfStock: 'bg-rose-500 text-white'
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shadow-sm',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

// Chip tag for categories, filters, status indicators
export const Chip = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { active?: boolean }
>(({ className, active = false, children, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium transition-all select-none',
        active
          ? 'bg-slate-900 text-white font-semibold shadow-sm'
          : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70 border border-stone-200/60',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});
Chip.displayName = 'Chip';

// FSSAI standard Veg / Non-Veg emblem badge
export const VegBadge: React.FC<{ isVeg?: boolean; className?: string }> = ({
  isVeg = true,
  className
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-4 h-4 rounded-sm border shrink-0',
        isVeg ? 'border-emerald-600 bg-emerald-50/50' : 'border-rose-600 bg-rose-50/50',
        className
      )}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      <span
        className={cn('w-2 h-2 rounded-full', isVeg ? 'bg-emerald-600' : 'bg-rose-600')}
      />
    </span>
  );
};
