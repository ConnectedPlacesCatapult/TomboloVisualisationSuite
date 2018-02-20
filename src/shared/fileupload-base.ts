
import {OgrFileInfoBase} from './ogrfileinfo-base';

export interface FileUploadBase {
  id?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  path: string;
  status?: 'uploaded' | 'validating' | 'ingesting' | 'done' | 'error';
  ogrInfo?: OgrFileInfoBase;
  error?: string;
  ownerId?: string;
  datasetId?: string;
  mapId?: string;
}
