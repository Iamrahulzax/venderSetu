import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Skeleton } from './Skeleton';

export interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Product image',
  className,
  containerClassName,
  fallbackSrc,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(!src);

  // If no src is provided, immediately treat as unavailable without requesting fake images
  const effectiveSrc = src || fallbackSrc;

  return (
    <div className={cn('relative w-full h-full overflow-hidden bg-stone-100 flex items-center justify-center', containerClassName)}>
      {!loaded && !hasError && effectiveSrc && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}

      {hasError || !effectiveSrc ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 border border-dashed border-stone-200 text-stone-400 p-2 text-center select-none">
          <ImageOff className="w-6 h-6 mb-1 text-stone-300 stroke-[1.5]" />
          <span className="text-[10px] font-medium text-stone-500">Image Unavailable</span>
          <span className="text-[9px] text-stone-400 mt-0.5">Awaiting merchant photo</span>
        </div>
      ) : (
        <img
          src={effectiveSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setHasError(true);
            setLoaded(true);
          }}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      )}
    </div>
  );
};
