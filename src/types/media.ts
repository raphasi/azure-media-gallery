export interface MediaItem {
  name: string;
  url: string;
  type: 'image' | 'video';
  contentType: string;
  size: number;
  lastModified: Date;
}

export interface AzureStorageConfig {
  containerUrl: string;
  sasToken: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}
