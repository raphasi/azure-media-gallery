import { useState, useEffect } from 'react';
import { RefreshCw, Settings, Zap, Database, Layers } from 'lucide-react';
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
        {/* Hero section */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          </div>
          
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-gradient-to-r from-primary to-transparent" />
                <span className="text-xs font-mono text-primary uppercase tracking-widest">
                  Azure Blob Storage
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
                Galeria de <span className="text-primary text-glow">Mídias</span>
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-sm font-mono">
                    {media.length} {media.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" />
                  <span className="text-sm font-mono">
                    {isConfigured ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>
            
            {isConfigured && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadMedia}
                disabled={isLoading}
                className="glass border-border/50 hover:border-primary/50 hover:text-primary gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            )}
          </div>
        </div>

        {!isConfigured ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl animate-glow-pulse" />
              <div className="relative glass-strong rounded-2xl p-8">
                <Settings className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3 flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              Azure Storage não configurado
            </h3>
            <p className="text-muted-foreground max-w-md mb-8 font-mono text-sm leading-relaxed">
              Faça login como administrador e configure o Azure Storage com sua URL do container e SAS Token para começar.
            </p>
            <Button 
              asChild 
              className="neon-glow bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <a href="/login">
                <Zap className="mr-2 h-4 w-4" />
                Fazer Login
              </a>
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl glass animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-full w-full bg-gradient-to-br from-primary/5 to-accent/5" />
              </div>
            ))}
          </div>
        ) : (
          <MediaGrid
            media={media}
            onMediaClick={setSelectedMedia}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/30 py-6">
        <div className="container flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>Azure Gallery v1.0</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-glow-pulse" />
            Sistema Online
          </span>
        </div>
      </footer>

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
