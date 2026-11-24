import { useEffect } from 'react';
import { X } from 'lucide-react';

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageLightboxProps {
  image: LightboxImage | null;
  onClose: () => void;
}

export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!image) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || 'Image preview'}
      className="animate-backdrop-fade fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-[2px] sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image preview"
        className="fixed right-4 top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white sm:right-6 sm:top-6"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <figure
        className="animate-dialog-enter relative flex max-h-[90vh] max-w-[92vw] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.src}
          alt={image.alt}
          referrerPolicy="no-referrer"
          className="max-h-[80vh] max-w-full rounded-[8px] border border-white/10 object-contain shadow-2xl"
        />
        {(image.caption || image.alt) && (
          <figcaption className="mt-3 max-w-2xl text-center text-sm text-[#EAE5DA]/90">
            {image.caption || image.alt}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
