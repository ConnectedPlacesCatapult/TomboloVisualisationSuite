import {IPalette} from './IPalette';

export interface IMapLayer {
  mapId?: string;
  layerId: string;
  name: string;
  description: string;
  layerType: string;
  palette: IPalette;
  paletteInverted: boolean;
  datasetId: string;
  datasetAttribute: string;
  labelAttribute: string;
  opacity: number;
  order: number;
}
