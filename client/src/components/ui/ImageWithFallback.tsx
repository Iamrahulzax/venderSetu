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

  // Default clean placeholder if no image provided
  const placeholderFallback =
    fallbackSrc ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

  return (
    <div className={cn('relative w-full h-full overflow-hidden bg-stone-100 flex items-center justify-center', containerClassName)}>
      {!loaded && !hasError && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}

      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-2 text-center">
          <ImageOff className="w-6 h-6 mb-1 opacity-50" />
          <span className="text-[10px] font-medium text-stone-400">Image Unavailable</span>
        </div>
      ) : (
        <img
          src={src || placeholderFallback}
          alt={alt}
          loading="lazy"
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
