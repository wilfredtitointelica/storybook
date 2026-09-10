// Reemplazo del FileSharingService real: mismos métodos, sin HttpClient, devuelve fixtures fijas.
import { of } from 'rxjs';
import { delayedOf } from '../shared.mocks';
import {
  fileSharingCategories,
  fileSharingClientInformation,
  fileSharingDateRange,
  fileSharingFiles,
  fileSharingFilesEmpty,
  fileSharingPeriods,
} from './file-sharing.data';

export function createMockFileSharingService(options?: { empty?: boolean }) {
  const files = options?.empty ? fileSharingFilesEmpty : fileSharingFiles;
  return {
    listFileSharing: () => delayedOf(files),
    getListPeriod: () => delayedOf(fileSharingPeriods),
    getListCategory: () => delayedOf(fileSharingCategories),
    GetClientInformation: () => delayedOf(fileSharingClientInformation),
    GetPropertiesPage: () => of([]),
    ListFileAlertById: () => delayedOf(files),
    uploadFile: () => of({} as any),
    SendUploadNotification: () => of(true),
    deleteFiles: () => of({}),
    downloadFile: () => of({} as any),
    GetDateRange: () => delayedOf(fileSharingDateRange),
  };
}
