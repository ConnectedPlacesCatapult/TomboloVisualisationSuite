import {EmuMapboxMap} from './mapbox.component';
import {Style as MapboxStyle, Layer as MapboxLayer} from 'mapbox-gl';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

export interface TomboloMapStyle extends MapboxStyle {
  metadata: TomboloStyleMetadata;
  layers: TomboloStyleLayer[];
}

export interface TomboloStyleLayer extends MapboxLayer {
  metadata: TomboloLayerMetadata;
}

export interface TomboloStyleMetadata {
  id: string;
  description: string;
  isPrivate: boolean;
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
  opacity: number;
  palette: {
    id: string;
    colorStops: string[];
    inverted: boolean
  }
}

export class TomboloMapboxMap extends EmuMapboxMap {

  private _cachedStyle: TomboloMapStyle = null;
  private _modified: boolean = false;
  private _modified$ = new Subject<boolean>();

  modified$(): Observable<boolean> {
    return this._modified$.asObservable();
  }

  getStyle(): TomboloMapStyle {

    if (!this._cachedStyle) {
      this._cachedStyle = super.getStyle() as TomboloMapStyle;
    }

    return this._cachedStyle
  }

  setStyle(style: string | MapboxStyle, options?: any): this {

    // Setting the style will overwrite any map modifications made in the editor
    // Save or clear modified flag first
    if (this._modified) {
      throw new Error('Overwriting modified map style!');
    }

    this._cachedStyle = null;

    // Workaround for missing options parameter in @types/mapbox
    const untypedSetStyle: any = super.setStyle.bind(this);
    untypedSetStyle(style, options);

    return this;
  }

  getLayer(layerID: string): TomboloStyleLayer {
    return super.getLayer(layerID) as TomboloStyleLayer;
  }

  get isModified(): boolean {
    return this._modified;
  }

  get id(): string {
    return this.getStyle().metadata.id;
  }

  get name(): string {
    return this.getStyle().name;
  }

  set name(val: string) {
    this._cachedStyle.name = val;
    this.setModified();
  }

  get description(): string {
    return this.getStyle().metadata.description;
  }

  set description(val: string) {
    this._cachedStyle.metadata.description = val;
    this.setModified();
  }

  get isPrivate(): boolean {
    return !!(this.getStyle().metadata.isPrivate);
  }

  set isPrivate(val: boolean) {
    this._cachedStyle.metadata.isPrivate = val;
    this.setModified();
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

  // Return zoom level below which data layers are not displayed
  get dataMinZoom(): number {

    if (!this.dataLayers) return 0;

    const minZooms = this.dataLayers.map(d => {
      return this.getLayer(d).minzoom;
    });

    return Math.max(...minZooms);
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
    // Warning - this will clear and unsaved modifications to the map
    this._cachedStyle = null;
  }

  setDataLayerOpacity(layerId: string, opacity: number): void {
    const layer = this.getLayer(layerId);
    const opacityProperty = layer.type + '-opacity';

    opacity = Math.max(Math.min(opacity, 1), 0);
    layer.metadata.opacity = opacity;
    this.setPaintProperty(layerId, opacityProperty, opacity);
    this.setModified();
  }


  setBasemapDetail(level: number): void {
    const basemapDetail = this.basemapDetail;

    if (!basemapDetail) return;

    Object.keys(basemapDetail.layers).forEach(key => {
      const layer = this.getLayer(key);
      if (!layer) throw new Error(`Unknown layer ${key}`);
      const opacity = (basemapDetail.layers[key] <= level) ? 1 : 0;

      switch (layer.type) {
        case 'line':
          this.setPaintProperty(key, 'line-opacity', opacity);
          break;
        case 'symbol':
          this.setPaintProperty(key, 'text-opacity', opacity);
          this.setPaintProperty(key, 'icon-opacity', opacity);
          break;
        case 'fill':
          this.setPaintProperty(key, 'fill-opacity', opacity);
          break;
        default:
          throw new Error(`Unsupported layer type for basemap detail: ${layer.type}`);
      }
    });
  }

  private setModified(): void {
    this._modified = true;
    this._modified$.next(true);
  }
}
