import { useState, useEffect } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import { MediaItem } from '@/types/media';
import { listBlobs, getStorageConfig } from '@/lib/azure-storage';
import { MediaGrid } from '@/components/gallery/MediaGrid';
import { Lightbox } from '@/components/gallery/Lightbox';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  const loadMedia = async () => {
    const config = getStorageConfig();
    if (!config) {
      setIsConfigured(false);
      setIsLoading(false);
      return;
    }

    setIsConfigured(true);
    setIsLoading(true);

    try {
      const items = await listBlobs(config);
      setMedia(items);
    } catch (error) {
      toast({
        title: 'Erro ao carregar mídias',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Galeria de Mídias</h1>
            <p className="mt-1 text-muted-foreground">
              {isConfigured 
                ? `${media.length} ${media.length === 1 ? 'item' : 'itens'} na galeria`
                : 'Configure o Azure Storage para começar'
              }
            </p>
          </div>
          
          {isConfigured && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadMedia}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}
        </div>

        {!isConfigured ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-secondary p-6 mb-4">
              <Settings className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Azure Storage não configurado
            </h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Faça login como administrador e configure o Azure Storage com sua URL do container e SAS Token.
            </p>
            <Button asChild>
              <a href="/login">Fazer Login</a>
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-lg bg-secondary"
              />
            ))}
          </div>
        ) : (
          <MediaGrid
            media={media}
            onMediaClick={setSelectedMedia}
          />
        )}
      </main>

      <Lightbox
        media={selectedMedia}
        allMedia={media}
        onClose={() => setSelectedMedia(null)}
        onNavigate={setSelectedMedia}
      />
    </div>
  );
};

export default Index;
