
export interface ITomboloDataset {
  id: string;
  name: string;
  description: string;
  attribution: string;
  sourceType: string;
  source: string;
  geometryColumn: string;
  geometryType: string;
  isPrivate: boolean;
  minZoom: number;
  maxZoom: number;
  extent: number[];
  headers: object;
  originalBytes: number;
  dbBytes: number;
  ownerId: string;
  datasetGroupId: string;
}
