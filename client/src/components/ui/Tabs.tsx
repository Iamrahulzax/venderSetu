import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

type TabsVariant = 'line' | 'segmented';

interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  variant?: TabsVariant;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange: controlledChange,
  variant = 'line',
  children,
  className
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newVal: string) => {
    if (controlledChange) {
      controlledChange(newVal);
    } else {
      setInternalValue(newVal);
    }
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange, variant }}>
      <div className={cn('w-full flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const ctx = useContext(TabsContext);
  const isSegmented = ctx?.variant === 'segmented';

  return (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        'flex items-center gap-1 overflow-x-auto scrollbar-none',
        isSegmented
          ? 'p-1 bg-stone-100 rounded-2xl border border-stone-200/80 inline-flex max-w-full'
          : 'border-b border-stone-200 gap-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error('TabsTrigger must be used within Tabs');

    const isActive = ctx.value === value;
    const isSegmented = ctx.variant === 'segmented';

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={() => ctx.onValueChange(value)}
        className={cn(
          'text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
          isSegmented
            ? cn(
                'px-3.5 py-1.5 rounded-xl',
                isActive
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              )
            : cn(
                'py-3 relative',
                isActive
                  ? 'text-stone-900 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900'
                  : 'text-stone-500 hover:text-stone-700'
              ),
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error('TabsContent must be used within Tabs');

    if (ctx.value !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn('pt-4 animate-fadeIn focus-visible:outline-none', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';
