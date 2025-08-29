type ImageStatus = 'INBOX' | 'COLLECTION' | 'ARCHIVE'

interface ImageMetadata {
  id: string;
  originalName: string;
  fileHash: string;
  status: ImageStatus;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: number;
  extension: string;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
}