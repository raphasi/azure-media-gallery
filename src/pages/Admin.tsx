import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Settings, Trash2, RefreshCw, Cloud, X, CheckCircle } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

    // Clear completed uploads after delay
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Painel de Administração</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie suas mídias e configurações do Azure Storage
          </p>
        </div>

        <Tabs defaultValue={isConfigured ? 'upload' : 'config'} className="space-y-6">
          <TabsList>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <Cloud className="h-4 w-4" />
              Mídias
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {!isConfigured ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Configure o Azure Storage na aba "Configuração" para fazer upload de mídias.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card
                  className={`border-2 border-dashed transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <CardContent className="py-10 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">
                      Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Suporta imagens (JPG, PNG, GIF, WebP) e vídeos (MP4, WebM, OGG)
                    </p>
                    <Button asChild>
                      <label className="cursor-pointer">
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
                  </CardContent>
                </Card>

                {uploads.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Uploads em andamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {uploads.map((upload) => (
                        <div key={upload.fileName} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {upload.fileName}
                            </span>
                            <div className="flex items-center gap-2">
                              {upload.status === 'completed' && (
                                <CheckCircle className="h-4 w-4 text-success" />
                              )}
                              {upload.status === 'error' && (
                                <span className="text-xs text-destructive">{upload.error}</span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => clearUpload(upload.fileName)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Progress value={upload.progress} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {media.length} {media.length === 1 ? 'item' : 'itens'} na galeria
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMedia()}
                disabled={isLoading}
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
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Azure Storage</CardTitle>
                <CardDescription>
                  Configure a conexão com seu Azure Blob Storage usando a URL do container e o SAS Token
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="containerUrl">URL do Container</Label>
                  <Input
                    id="containerUrl"
                    type="url"
                    placeholder="https://suaconta.blob.core.windows.net/seucontainer"
                    value={containerUrl}
                    onChange={(e) => setContainerUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Exemplo: https://minhacontastorage.blob.core.windows.net/medias
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sasToken">SAS Token</Label>
                  <Input
                    id="sasToken"
                    type="password"
                    placeholder="sv=2021-06-08&ss=b&srt=sco&sp=rwdlacitfx..."
                    value={sasToken}
                    onChange={(e) => setSasToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Shared Access Signature com permissões de leitura, escrita, listagem e exclusão
                  </p>
                </div>

                <Button onClick={handleSaveConfig} className="w-full">
                  Salvar Configuração
                </Button>

                {isConfigured && (
                  <p className="text-center text-sm text-success">
                    ✓ Azure Storage configurado
                  </p>
                )}
              </CardContent>
            </Card>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar "{deleteTarget?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
