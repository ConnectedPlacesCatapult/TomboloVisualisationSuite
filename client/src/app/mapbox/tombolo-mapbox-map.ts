import {EmuMapboxMap} from './mapbox.component';
import {Style as MapboxStyle, Layer as MapboxLayer} from 'mapbox-gl';

export interface TomboloMapStyle extends MapboxStyle {
  metadata: TomboloStyleMetadata;
  layers: TomboloStyleLayer[];
}

export interface TomboloStyleLayer extends MapboxLayer {
  metadata: TomboloLayerMetadata;
}

export interface TomboloStyleMetadata {
  description: string;
  insertionPoints: {[key: string]: string};
  basemapDetail: TombolBasemapDetailMetadata;
  datasets: TomboloDatasetMetadata[],
  dataLayers: string[];
}

export interface TombolBasemapDetailMetadata {
  defaultDetailLevel: number;
  layers: {[key: string]: number};
}

export interface TomboloDatasetMetadata {
  id: string;
  name: string;
  description: string | null;
  geometryType: 'Polygon' | 'LineString' | 'Point';
  attributes: TomboloDataAttributeMetadata[];
}

export interface TomboloDataAttributeMetadata {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  minValue: number | null;
  maxValue: number | null;
  quantiles5: number[] | null;
  qualtiles10: number[] | null;
  type: 'number' | 'string';
  categories: string[] | null;
}

export interface TomboloLayerMetadata {
  dataset: string;
  attribute: string;
  palette: {
    id: string;
    colorStops: string[];
    inverted: boolean
  }
}

export class TomboloMapboxMap extends EmuMapboxMap {

  getStyle(): TomboloMapStyle {
    return super.getStyle() as TomboloMapStyle;
  }

}
