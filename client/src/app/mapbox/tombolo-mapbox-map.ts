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
  recipe: string;
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

  setStyle(style: string | MapboxStyle, options?: any): this {

    this._cachedStyle = null;

    // Workaround for missing options parameter in @types/mapbox
    const untypedSetStyle: any = super.setStyle.bind(this);
    untypedSetStyle(style, options);

    return this;
  }

  getLayer(layerID: string): TomboloStyleLayer {
    return super.getLayer(layerID) as TomboloStyleLayer;
  }

  get name(): string {
    return this.getStyle().name;
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

  get basemapDetail(): TombolBasemapDetailMetadata {
    return this.getStyle().metadata.basemapDetail;
  }

  get recipe(): string {
    return this.getStyle().metadata.recipe;
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

  clearCache(): void {
    this._cachedStyle = null;
  }

  setBasemapDetail(level: number): void {
    const basemapDetail = this.basemapDetail;

    if (!basemapDetail) return;

    Object.keys(basemapDetail.layers).forEach(key => {
      const layer = this.getLayer(key);
      if (!layer) throw new Error(`Unknown layer ${key}`);
      let prop: string;
      switch (layer.type) {
        case 'line':
          prop = 'line-opacity';
          break;
        case 'symbol':
          prop = 'text-opacity';
          break;
        case 'fill':
          prop = 'fill-opacity';
          break;
        default:
          throw new Error(`Unsupported layer type for basemap detail: ${layer.type}`);
      }

      this.setPaintProperty(key, prop, (basemapDetail.layers[key] <= level) ? 1 : 0);
    });
  }
}
