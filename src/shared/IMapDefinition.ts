import {ITomboloDataset} from './ITomboloDataset';
import {IMapLayer} from './IMapLayer';
import {IMapFilter} from './IMapFilter';

// Map definition used for style generation

export interface IMapDefinition {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  zoom: number;
  center: number[];
  datasets: ITomboloDataset[];
  layers: IMapLayer[];
  recipe: string;
  basemapId: string;
  basemapDetailLevel: number;
  tileBaseUrl: string;
  ownerId: string;
  filters: IMapFilter[];
  ui: object;
}
