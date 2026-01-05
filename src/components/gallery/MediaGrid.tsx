import { MediaItem } from '@/types/media';
import { MediaCard } from './MediaCard';
import { Database, Sparkles } from 'lucide-react';

interface MediaGridProps {
  media: MediaItem[];
  onMediaClick: (media: MediaItem) => void;
}

export function MediaGrid({ media, onMediaClick }: MediaGridProps) {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-glow-pulse" />
          <div className="relative rounded-2xl glass p-8">
            <Database className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Nenhuma mídia encontrada
        </h3>
        <p className="text-muted-foreground max-w-sm font-mono text-sm">
          Configure o Azure Storage e faça upload de imagens ou vídeos para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {media.map((item, index) => (
        <div
          key={item.name}
          style={{ animationDelay: `${index * 50}ms` }}
          className="animate-slide-up"
        >
          <MediaCard
            media={item}
            onClick={() => onMediaClick(item)}
          />
        </div>
      ))}
    </div>
  );
}
