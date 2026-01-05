import { Play, Image as ImageIcon } from 'lucide-react';
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
        "group relative aspect-square overflow-hidden rounded-xl cursor-pointer",
        "glass border border-border/30",
        "transition-all duration-500",
        "hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]",
        "animate-fade-in"
      )}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
      </div>

      {media.type === 'image' ? (
        <img
          src={media.url}
          alt={media.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
      ) : (
        <div className="relative h-full w-full">
          <video
            src={media.url}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary blur-md opacity-60 animate-glow-pulse" />
              <div className="relative rounded-full bg-primary/90 p-4 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                <Play className="h-6 w-6 text-primary-foreground" fill="currentColor" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Type indicator */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="rounded-md bg-background/80 backdrop-blur-sm px-2 py-1 flex items-center gap-1.5">
          {media.type === 'image' ? (
            <ImageIcon className="h-3 w-3 text-primary" />
          ) : (
            <Play className="h-3 w-3 text-primary" />
          )}
          <span className="text-xs font-mono text-foreground uppercase">{media.type}</span>
        </div>
      </div>
      
      {/* Info overlay */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <div className="bg-gradient-to-t from-background via-background/95 to-transparent p-4 pt-8">
          <p className="truncate text-sm font-medium text-foreground">{media.name}</p>
          <p className="text-xs font-mono text-primary">
            {(media.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/30 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/30 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
