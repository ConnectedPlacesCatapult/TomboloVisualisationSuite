import {ITomboloDataset} from './ITomboloDataset';
import {IMapLayer} from './IMapLayer';

// Map definition used for style generation

export interface IMapDefinition {
  id: string;
  name: string;
  description: string;
  zoom: number;
  center: number[];
  datasets: ITomboloDataset[];
  layers: IMapLayer[];
  recipe: string;
  basemapDetailLevel: number;
}
