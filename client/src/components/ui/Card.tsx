import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white/95 backdrop-blur-sm border border-stone-200/90 rounded-2xl overflow-hidden transition-all duration-200',
          interactive &&
            'hover:border-stone-300 hover:shadow-md cursor-pointer group hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { aspectRatio?: string }
>(({ className, aspectRatio = 'aspect-[4/3]', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('relative w-full overflow-hidden bg-stone-100', aspectRatio, className)}
      {...props}
    >
      {children}
    </div>
  );
});
CardMedia.displayName = 'CardMedia';

export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-4 flex flex-col gap-1.5', className)} {...props}>
        {children}
      </div>
    );
  }
);
CardBody.displayName = 'CardBody';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn('font-bold text-sm text-stone-900 tracking-tight leading-snug', className)}
      {...props}
    >
      {children}
    </h3>
  );
});
CardTitle.displayName = 'CardTitle';

export const CardText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p ref={ref} className={cn('text-xs text-stone-500 line-clamp-2 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
});
CardText.displayName = 'CardText';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('pt-3 mt-auto flex items-center justify-between gap-2 border-t border-stone-100', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';
