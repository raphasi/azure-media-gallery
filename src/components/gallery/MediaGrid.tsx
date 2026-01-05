import { MediaItem } from '@/types/media';
import { MediaCard } from './MediaCard';

interface MediaGridProps {
  media: MediaItem[];
  onMediaClick: (media: MediaItem) => void;
}

export function MediaGrid({ media, onMediaClick }: MediaGridProps) {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-secondary p-6 mb-4">
          <svg
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma mídia encontrada</h3>
        <p className="text-muted-foreground max-w-sm">
          Configure o Azure Storage e faça upload de imagens ou vídeos para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {media.map((item) => (
        <MediaCard
          key={item.name}
          media={item}
          onClick={() => onMediaClick(item)}
        />
      ))}
    </div>
  );
}
