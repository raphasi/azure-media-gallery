import { AzureStorageConfig, MediaItem } from '@/types/media';

const STORAGE_KEY = 'azure_storage_config';

export function getStorageConfig(): AzureStorageConfig | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveStorageConfig(config: AzureStorageConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearStorageConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildBlobUrl(config: AzureStorageConfig, blobName: string): string {
  const baseUrl = config.containerUrl.endsWith('/') 
    ? config.containerUrl.slice(0, -1) 
    : config.containerUrl;
  const sasToken = config.sasToken.startsWith('?') 
    ? config.sasToken 
    : `?${config.sasToken}`;
  return `${baseUrl}/${encodeURIComponent(blobName)}${sasToken}`;
}

export function getMediaType(contentType: string): 'image' | 'video' {
  if (contentType.startsWith('video/')) return 'video';
  return 'image';
}

export function isValidMediaType(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ];
  return validTypes.includes(file.type);
}

export async function listBlobs(config: AzureStorageConfig): Promise<MediaItem[]> {
  const baseUrl = config.containerUrl.endsWith('/') 
    ? config.containerUrl.slice(0, -1) 
    : config.containerUrl;
  const sasToken = config.sasToken.startsWith('?') 
    ? config.sasToken 
    : `?${config.sasToken}`;
  
  const listUrl = `${baseUrl}${sasToken}&restype=container&comp=list`;
  
  const response = await fetch(listUrl);
  
  if (!response.ok) {
    throw new Error(`Erro ao listar blobs: ${response.statusText}`);
  }
  
  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const blobs = xmlDoc.getElementsByTagName('Blob');
  const mediaItems: MediaItem[] = [];
  
  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    const name = blob.getElementsByTagName('Name')[0]?.textContent || '';
    const contentType = blob.getElementsByTagName('Content-Type')[0]?.textContent || 'application/octet-stream';
    const size = parseInt(blob.getElementsByTagName('Content-Length')[0]?.textContent || '0', 10);
    const lastModified = new Date(blob.getElementsByTagName('Last-Modified')[0]?.textContent || '');
    
    const mediaType = getMediaType(contentType);
    
    if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
      mediaItems.push({
        name,
        url: buildBlobUrl(config, name),
        type: mediaType,
        contentType,
        size,
        lastModified,
      });
    }
  }
  
  return mediaItems.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

export async function uploadBlob(
  config: AzureStorageConfig,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const blobUrl = buildBlobUrl(config, file.name);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(blobUrl.split('?')[0]);
      } else {
        reject(new Error(`Upload falhou: ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Erro de rede durante o upload'));
    });
    
    xhr.open('PUT', blobUrl);
    xhr.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

export async function deleteBlob(config: AzureStorageConfig, blobName: string): Promise<void> {
  const blobUrl = buildBlobUrl(config, blobName);
  
  const response = await fetch(blobUrl, {
    method: 'DELETE',
  });
  
  if (!response.ok && response.status !== 404) {
    throw new Error(`Erro ao deletar blob: ${response.statusText}`);
  }
}
