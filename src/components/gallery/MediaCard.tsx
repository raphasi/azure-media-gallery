import { Play } from 'lucide-react';
import { MediaItem } from '@/types/media';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  media: MediaItem;
  onClick: () => void;
}

export function MediaCard({ media, onClick }: MediaCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg cursor-pointer",
        "bg-secondary border border-border",
        "transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
        "animate-fade-in"
      )}
    >
      {media.type === 'image' ? (
        <img
          src={media.url}
          alt={media.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="relative h-full w-full">
          <video
            src={media.url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-background/30">
            <div className="rounded-full bg-primary p-3 transition-transform duration-300 group-hover:scale-110">
              <Play className="h-6 w-6 text-primary-foreground" fill="currentColor" />
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="truncate text-sm font-medium text-foreground">{media.name}</p>
        <p className="text-xs text-muted-foreground">
          {(media.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
}
