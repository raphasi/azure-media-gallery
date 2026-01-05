import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react';
import { MediaItem } from '@/types/media';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LightboxProps {
  media: MediaItem | null;
  allMedia: MediaItem[];
  onClose: () => void;
  onNavigate: (media: MediaItem) => void;
  onDelete?: (media: MediaItem) => void;
  showDeleteButton?: boolean;
}

export function Lightbox({ 
  media, 
  allMedia, 
  onClose, 
  onNavigate, 
  onDelete,
  showDeleteButton = false 
}: LightboxProps) {
  const currentIndex = media ? allMedia.findIndex(m => m.name === media.name) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allMedia.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(allMedia[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, allMedia, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigate(allMedia[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, allMedia, onNavigate]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  }, [onClose, handlePrev, handleNext]);

  useEffect(() => {
    if (media) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [media, handleKeyDown]);

  if (!media) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = media.url;
    link.download = media.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 z-10 text-foreground hover:bg-secondary"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Action buttons */}
      <div className="absolute right-4 top-16 z-10 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground hover:bg-secondary"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          title="Download"
        >
          <Download className="h-5 w-5" />
        </Button>
        {showDeleteButton && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(media);
            }}
            title="Deletar"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation buttons */}
      {hasPrev && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 z-10 h-12 w-12 rounded-full text-foreground hover:bg-secondary"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 z-10 h-12 w-12 rounded-full text-foreground hover:bg-secondary"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          style={{ right: '4rem' }}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Media content */}
      <div 
        className={cn(
          "relative max-h-[85vh] max-w-[90vw] animate-scale-in",
          media.type === 'video' ? 'w-full max-w-4xl' : ''
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {media.type === 'image' ? (
          <img
            src={media.url}
            alt={media.name}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
        ) : (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-h-[85vh] w-full rounded-lg"
          />
        )}

        {/* Media info */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-gradient-to-t from-background/90 to-transparent p-4">
          <p className="font-medium text-foreground">{media.name}</p>
          <p className="text-sm text-muted-foreground">
            {(media.size / 1024 / 1024).toFixed(2)} MB • {media.lastModified.toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
