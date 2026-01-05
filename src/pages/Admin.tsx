import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Settings, Trash2, RefreshCw, Cloud, X, CheckCircle, Zap, Database, HardDrive, Cpu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MediaItem, UploadProgress } from '@/types/media';
import { 
  getStorageConfig, 
  saveStorageConfig, 
  listBlobs, 
  uploadBlob, 
  deleteBlob,
  isValidMediaType 
} from '@/lib/azure-storage';
import { Header } from '@/components/layout/Header';
import { MediaGrid } from '@/components/gallery/MediaGrid';
import { Lightbox } from '@/components/gallery/Lightbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Admin() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [containerUrl, setContainerUrl] = useState('');
  const [sasToken, setSasToken] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const config = getStorageConfig();
    if (config) {
      setContainerUrl(config.containerUrl);
      setSasToken(config.sasToken);
      setIsConfigured(true);
      loadMedia(config);
    }
  }, [isAuthenticated, navigate]);

  const loadMedia = async (config = getStorageConfig()) => {
    if (!config) return;

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

  const handleSaveConfig = () => {
    if (!containerUrl || !sasToken) {
      toast({
        title: 'Erro',
        description: 'Preencha a URL do container e o SAS Token',
        variant: 'destructive',
      });
      return;
    }

    const config = { containerUrl, sasToken };
    saveStorageConfig(config);
    setIsConfigured(true);
    loadMedia(config);
    
    toast({
      title: 'Configuração salva',
      description: 'Azure Storage configurado com sucesso',
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const config = getStorageConfig();
    if (!config) {
      toast({
        title: 'Erro',
        description: 'Configure o Azure Storage primeiro',
        variant: 'destructive',
      });
      return;
    }

    const validFiles = Array.from(files).filter(file => {
      if (!isValidMediaType(file)) {
        toast({
          title: 'Arquivo inválido',
          description: `${file.name} não é um tipo de mídia suportado`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    const newUploads: UploadProgress[] = validFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }));

    setUploads(prev => [...prev, ...newUploads]);

    for (const file of validFiles) {
      setUploads(prev =>
        prev.map(u =>
          u.fileName === file.name ? { ...u, status: 'uploading' } : u
        )
      );

      try {
        await uploadBlob(config, file, (progress) => {
          setUploads(prev =>
            prev.map(u =>
              u.fileName === file.name ? { ...u, progress } : u
            )
          );
        });

        setUploads(prev =>
          prev.map(u =>
            u.fileName === file.name ? { ...u, status: 'completed', progress: 100 } : u
          )
        );
      } catch (error) {
        setUploads(prev =>
          prev.map(u =>
            u.fileName === file.name
              ? { ...u, status: 'error', error: error instanceof Error ? error.message : 'Erro' }
              : u
          )
        );
      }
    }

    setTimeout(() => {
      setUploads(prev => prev.filter(u => u.status !== 'completed'));
      loadMedia();
    }, 2000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const config = getStorageConfig();
    if (!config) return;

    try {
      await deleteBlob(config, deleteTarget.name);
      setMedia(prev => prev.filter(m => m.name !== deleteTarget.name));
      setSelectedMedia(null);
      toast({
        title: 'Mídia deletada',
        description: `${deleteTarget.name} foi removido`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao deletar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const clearUpload = (fileName: string) => {
    setUploads(prev => prev.filter(u => u.fileName !== fileName));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Hero */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-gradient-to-r from-primary to-transparent" />
            <span className="text-xs font-mono text-primary uppercase tracking-widest">
              Painel de Controle
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Central de <span className="text-primary text-glow">Administração</span>
          </h1>
          <p className="mt-2 text-muted-foreground font-mono text-sm">
            Gerencie suas mídias e configurações do Azure Storage
          </p>
        </div>

        <Tabs defaultValue={isConfigured ? 'upload' : 'config'} className="space-y-6">
          <TabsList className="glass border border-border/50 p-1">
            <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="h-4 w-4" />
              Mídias
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Cpu className="h-4 w-4" />
              Configuração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {!isConfigured ? (
              <div className="glass-strong rounded-2xl p-12 text-center">
                <Settings className="mx-auto h-16 w-16 text-primary mb-4" />
                <p className="text-muted-foreground font-mono">
                  Configure o Azure Storage na aba "Configuração" para fazer upload de mídias.
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`glass-strong rounded-2xl border-2 border-dashed transition-all duration-300 ${
                    isDragging ? 'border-primary bg-primary/5 neon-glow' : 'border-border/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="p-12 text-center">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl animate-glow-pulse" />
                      <div className="relative rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-6">
                        <Cloud className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <p className="text-xl font-semibold text-foreground mb-2">
                      Arraste arquivos aqui
                    </p>
                    <p className="text-sm font-mono text-muted-foreground mb-6">
                      ou clique para selecionar • JPG, PNG, GIF, WebP, MP4, WebM
                    </p>
                    <Button asChild className="neon-glow bg-primary text-primary-foreground">
                      <label className="cursor-pointer">
                        <Zap className="mr-2 h-4 w-4" />
                        Selecionar Arquivos
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e.target.files)}
                        />
                      </label>
                    </Button>
                  </div>
                </div>

                {uploads.length > 0 && (
                  <div className="glass-strong rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground mb-4">
                      <HardDrive className="h-4 w-4 text-primary" />
                      Uploads em andamento
                    </div>
                    {uploads.map((upload) => (
                      <div key={upload.fileName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono truncate max-w-[200px]">
                            {upload.fileName}
                          </span>
                          <div className="flex items-center gap-2">
                            {upload.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-success" />
                            )}
                            {upload.status === 'error' && (
                              <span className="text-xs font-mono text-destructive">{upload.error}</span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:text-destructive"
                              onClick={() => clearUpload(upload.fileName)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                          <div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-all duration-300"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
                <Database className="h-4 w-4 text-primary" />
                {media.length} {media.length === 1 ? 'item' : 'itens'} na galeria
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMedia()}
                disabled={isLoading}
                className="glass border-border/50 hover:border-primary/50 hover:text-primary"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl glass animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <MediaGrid
                media={media}
                onMediaClick={setSelectedMedia}
              />
            )}
          </TabsContent>

          <TabsContent value="config">
            <div className="glass-strong rounded-2xl p-8 relative overflow-hidden">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-2xl" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 p-3">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Configuração do Azure Storage</h2>
                  <p className="text-sm font-mono text-muted-foreground">
                    Conecte seu container usando URL e SAS Token
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="containerUrl" className="text-sm font-mono text-muted-foreground uppercase">
                    URL do Container
                  </Label>
                  <Input
                    id="containerUrl"
                    type="url"
                    placeholder="https://suaconta.blob.core.windows.net/seucontainer"
                    value={containerUrl}
                    onChange={(e) => setContainerUrl(e.target.value)}
                    className="h-12 glass border-border/50 focus:border-primary/50 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sasToken" className="text-sm font-mono text-muted-foreground uppercase">
                    SAS Token
                  </Label>
                  <Input
                    id="sasToken"
                    type="password"
                    placeholder="sv=2021-06-08&ss=b&srt=sco&sp=rwdlacitfx..."
                    value={sasToken}
                    onChange={(e) => setSasToken(e.target.value)}
                    className="h-12 glass border-border/50 focus:border-primary/50 font-mono text-sm"
                  />
                  <p className="text-xs font-mono text-muted-foreground">
                    Permissões necessárias: leitura, escrita, listagem e exclusão
                  </p>
                </div>

                <Button 
                  onClick={handleSaveConfig} 
                  className="w-full h-12 neon-glow bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Salvar Configuração
                </Button>

                {isConfigured && (
                  <div className="flex items-center justify-center gap-2 text-sm font-mono text-success">
                    <CheckCircle className="h-4 w-4" />
                    Azure Storage conectado
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Lightbox
        media={selectedMedia}
        allMedia={media}
        onClose={() => setSelectedMedia(null)}
        onNavigate={setSelectedMedia}
        onDelete={setDeleteTarget}
        showDeleteButton={true}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="glass-strong border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-muted-foreground">
              Tem certeza que deseja deletar "{deleteTarget?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass border-border/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
