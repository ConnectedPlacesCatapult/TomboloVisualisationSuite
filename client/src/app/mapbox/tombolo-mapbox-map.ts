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

  private _cachedStyle: TomboloMapStyle = null;

  getStyle(): TomboloMapStyle {

    if (!this._cachedStyle) {
      this._cachedStyle = super.getStyle() as TomboloMapStyle;
    }

    return this._cachedStyle
  }

  setStyle(style: string | MapboxStyle): this {

    this._cachedStyle = null;
    super.setStyle(style);

    return this;
  }

  getLayer(layerID: string): TomboloStyleLayer {
    return super.getLayer(layerID) as TomboloStyleLayer;
  }

  get description(): string {
    return this.getStyle().metadata.description;
  }

  get datasets(): TomboloDatasetMetadata[] {
    return this.getStyle().metadata.datasets;
  }

  get dataLayers(): string[] {
    return this.getStyle().metadata.dataLayers;
  }

  getDatasetForLayer(layerID: string): TomboloDatasetMetadata {
    const layer = this.getLayer(layerID);
    const datasetID = layer.metadata.dataset;
    const dataset = this.datasets.find(d => d.id === datasetID);

    if (!dataset) {
      throw new Error(`Dataset not found on layer: ${layerID}`);
    }

    return dataset;
  }

  getDataAttributesForLayer(layerID: string): TomboloDataAttributeMetadata[] {
    return this.getDatasetForLayer(layerID).attributes;
  }

  getDataAttributeForLayer(layerID: string, attributeID: string): TomboloDataAttributeMetadata {
    const attribute = this.getDataAttributesForLayer(layerID).find(a => a.id === attributeID);
    if (!attribute) {
      throw new Error(`Data attribute '${attributeID} not found on layer: ${layerID}`);
    }

    return attribute;
  }
}
