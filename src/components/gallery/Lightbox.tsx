import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Trash2, Maximize2 } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      {/* Decorative grid */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 glass-strong border-b border-border/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Maximize2 className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm text-muted-foreground">
            {currentIndex + 1} / {allMedia.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-primary hover:bg-primary/10"
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
              className="hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(media);
              }}
              title="Deletar"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-foreground hover:bg-secondary"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation buttons */}
      {hasPrev && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 z-10 h-14 w-14 rounded-full glass hover:bg-primary/10 hover:text-primary transition-all"
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
          className="absolute right-4 z-10 h-14 w-14 rounded-full glass hover:bg-primary/10 hover:text-primary transition-all"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Media content */}
      <div 
        className={cn(
          "relative max-h-[80vh] max-w-[85vw] mt-16 animate-scale-in",
          media.type === 'video' ? 'w-full max-w-5xl' : ''
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-xl overflow-hidden glass border border-border/30">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-xl z-10" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-xl z-10" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-xl z-10" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-xl z-10" />
          
          {media.type === 'image' ? (
            <img
              src={media.url}
              alt={media.name}
              className="max-h-[75vh] max-w-full object-contain"
            />
          ) : (
            <video
              src={media.url}
              controls
              autoPlay
              className="max-h-[75vh] w-full"
            />
          )}
        </div>

        {/* Media info */}
        <div className="mt-4 glass-strong rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">{media.name}</p>
            <p className="text-sm font-mono text-muted-foreground">
              {(media.size / 1024 / 1024).toFixed(2)} MB • {media.lastModified.toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
            <span className="text-xs font-mono text-primary uppercase">{media.type}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
