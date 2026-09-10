import { Subscription } from 'rxjs';

export interface InputFileRequest {
  fileId: number;
  file: File;
  fileName: string;
  fileNameSystem: string;
  extension: string;
  name: string;
  description: string;
  category: number;
  isCorrect: boolean;
  message: string;
  load: number;
  size: number;
  status: number;
  subscription: Subscription | undefined;
  base64: string;
  filePath: string;
  fileExtension: string;
  errorTooltip: string;
}
export interface FileEntryRequest {
  fullName: string;
  file: File;
}
export interface FileTableRequest {
  fileId: number;
  fileShared: number;
}
export interface FileSharingFilterRequest {
  fileName: string;
  periodId: number;
  startDate: Date;
  endDate: Date;
  categorySelected: number[];
  clientIdsSelected: number[];
}
export interface FileSharingDownloadRequest {
  fileId: number;
  fileNameSystem?: string;
  fileNameUser?: string;
}
