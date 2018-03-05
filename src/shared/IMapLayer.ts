import {IPalette} from './IPalette';

export interface IMapLayer {
  mapId?: string;
  layerId: string; // Id of layer in front end (has data layer prefix)
  originalLayerId?: string; // Id of layer in backend
  name: string;
  description: string;
  layerType: 'fill' | 'circle' | 'line';
  palette: IPalette;
  paletteInverted: boolean;
  datasetId: string;
  colorAttribute: string;
  fixedColor: string;
  colorMode: 'fixed' | 'attribute';
  sizeAttribute: string;
  fixedSize: number;
  sizeMode: 'fixed' | 'attribute';
  labelAttribute: string;
  opacity: number;
  visible: boolean;
  order: number;
}
