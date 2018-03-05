import {EmuMapboxMap} from './mapbox.component';
import * as Debug from 'debug';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {IMapDefinition} from '../../../../src/shared/IMapDefinition';
import {ITomboloDataset} from '../../../../src/shared/ITomboloDataset';
import {IMapLayer} from '../../../../src/shared/IMapLayer';
import {IBasemapDetailMetadata, IStyle, IStyleMetadata} from '../../../../src/shared/IStyle';
import {ITomboloDatasetAttribute} from '../../../../src/shared/ITomboloDatasetAttribute';
import {LABEL_LAYER_PREFIX, StyleGenerator} from '../../../../src/shared/style-generator/style-generator';
import {IPalette} from '../../../../src/shared/IPalette';
import {MapboxOptions, Layer as MapboxLayer} from 'mapbox-gl';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/throttleTime';
import 'rxjs/add/operator/auditTime';

const debug = Debug('tombolo:mapboxgl');

const PAINT_LAYER_REGENERATION_DEBOUNCE = 300;
const LABEL_LAYER_REGENERATION_DEBOUNCE = 500;

export class TomboloMapboxMap extends EmuMapboxMap {

  private _metadata: IStyleMetadata;
  private _mapDefinition: IMapDefinition;
  private _modified: boolean = false;
  private _modified$ = new Subject<boolean>();
  private _mapLoaded = false;
  private _styleGenerater: StyleGenerator;

  private _regeneratePainStyle$ = new Subject<IMapLayer>();
  private _regenerateLabelLayer$ = new Subject<IMapLayer>();

  constructor(options?: MapboxOptions) {
    super(options);

    // Hook up debounced paint style regeneration
    this._regeneratePainStyle$.auditTime(PAINT_LAYER_REGENERATION_DEBOUNCE).subscribe((layer) => {
      this.debouncedRegeneratePaintStyle(layer);
    });

    // Hook up debounced label layer regeneration
    this._regenerateLabelLayer$.auditTime(LABEL_LAYER_REGENERATION_DEBOUNCE).subscribe((layer) => {
      this.debouncedRegenerateLabelLayer(layer);
    });
  }

  modified$(): Observable<boolean> {
    return this._modified$.asObservable();
  }

  beginLoad() {
    this._metadata = null;
    this._mapDefinition = null;
    this._mapLoaded = false;
    this._styleGenerater = null;

    debug('beginning map load');
  }

  finalizeLoad() {
    this._metadata = this.getStyle().metadata;
    this._mapDefinition = this._metadata.mapDefinition;
    this._mapLoaded = true;

    // TODO baseURL
    this._styleGenerater = new StyleGenerator(this._mapDefinition, '');

    debug('map load finalized');
  }

  get mapLoaded(): boolean {
    return this._mapLoaded;
  }

  get isModified(): boolean {
    return this._modified;
  }

  get id(): string {
    return (this._mapDefinition) ? this._mapDefinition.id : null;
  }

  get name(): string {
    return (this._mapDefinition) ? this._mapDefinition.name : null;
  }

  set name(val: string) {
    this._mapDefinition.name = val;
    this.setModified();
  }

  get description(): string {
    return (this._mapDefinition) ? this._mapDefinition.description : null;
  }

  set description(val: string) {
    this._mapDefinition.description = val;
    this.setModified();
  }

  get isPrivate(): boolean {
    return (this._mapDefinition) ? !!(this._mapDefinition.isPrivate) : false;
  }

  set isPrivate(val: boolean) {
    this._mapDefinition.isPrivate = val;
    this.setModified();
  }

  get datasets(): ITomboloDataset[] {
    return (this._mapDefinition) ? this._mapDefinition.datasets : [];
  }


  get dataLayers(): IMapLayer[] {
    return (this._mapDefinition) ? this._mapDefinition.layers : [];
  }

  getDataLayer(layerId: string): IMapLayer {
    return this.dataLayers.find(d => d.layerId === layerId);
  }

  getLabelLayerId(layerId: string): string {
    const dataLayer = this.dataLayers.find(d => d.layerId === layerId);

    return (dataLayer && dataLayer.labelAttribute)? LABEL_LAYER_PREFIX + dataLayer.originalLayerId : null;
  }

  get dataLayerIds(): string[] {
    return (this._mapDefinition) ? this._mapDefinition.layers.map(l => l.layerId) : [];
  }

  get basemapDetail(): IBasemapDetailMetadata {
    return this._metadata.basemapDetail;
  }

  get recipe(): string {
    return (this._mapDefinition) ? this._mapDefinition.recipe : null;
  }

  // Return zoom level below which data layers are not displayed
  get dataMinZoom(): number {

    if (!this._mapDefinition) return 0;

    const minZooms = this._mapDefinition.datasets.map(d => {
      return d.minZoom;
    });

    return Math.max(...minZooms);
  }

  getDatasetForLayer(layerId: string): ITomboloDataset {

    const dataLayer = this.getDataLayer(layerId);

    if (!dataLayer) throw new Error(`Data layer ${layerId} not found`);

    const dataset = this.datasets.find(d => d.id === dataLayer.datasetId);

    return dataset;
  }

  getDataAttributesForLayer(layerId: string): ITomboloDatasetAttribute[] {
    return this.getDatasetForLayer(layerId).dataAttributes;
  }

  getDataAttributeForLayer(layerId: string, attributeId: string): ITomboloDatasetAttribute {
    const attribute = this.getDataAttributesForLayer(layerId).find(a => a.field === attributeId);

    if (!attribute) {
      throw new Error(`Data attribute '${attributeId} not found on layer: ${layerId}`);
    }

    return attribute;
  }

  setDataLayerVisibility(layerId: string, visible: boolean): void {

    const layer = this.getDataLayer(layerId);
    const labelLayerId = this.getLabelLayerId(layerId);
    layer.visible = visible;

    this.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    if (labelLayerId) {
      this.setLayoutProperty(labelLayerId,'visibility', visible ? 'visible' : 'none');
    }

    this.setModified();
  }

  setDataLayerOpacity(layerId: string, opacity: number): void {

    const layer = this.getDataLayer(layerId);
    const labelLayerId = this.getLabelLayerId(layerId);

    if (!layer) throw new Error(`Data layer ${layerId} not found`);

    const opacityProperty = layer.layerType + '-opacity';

    layer.opacity = Math.max(Math.min(opacity, 1), 0);

    this.setPaintProperty(layerId, opacityProperty, opacity);

    if (labelLayerId) {
      this.setPaintProperty(labelLayerId, 'text-opacity', opacity);
    }

    this.setModified();
  }

  setDataLayerFixedColor(layerId: string, color: string): void {

    const layer = this.getDataLayer(layerId);
    if (!layer) throw new Error(`Data layer ${layerId} not found`);

    layer.fixedColor = color;
    this.regenerateLayerPaintStyle(layer);

    this.setModified();
  }

  setDataLayerColorAttribute(layerId: string, colorAttribute: string): void {

    const layer = this.getDataLayer(layerId);
    if (!layer) throw new Error(`Data layer ${layerId} not found`);

    layer.colorAttribute = colorAttribute;
    this.regenerateLayerPaintStyle(layer);

    this.setModified();
  }

  setDataLayerColorMode(layerId: string, colorMode: 'attribute' | 'fixed'): void {

    const layer = this.getDataLayer(layerId);
    if (!layer) throw new Error(`Data layer ${layerId} not found`);

    layer.colorMode = colorMode;
    this.regenerateLayerPaintStyle(layer);

    this.setModified();
  }

  setDataLayerPalette(layerId: string, palette: IPalette): void {

    const layer = this.getDataLayer(layerId);
    if (!layer) throw new Error(`Data layer ${layerId} not found`);

    layer.palette = palette;
    this.regenerateLayerPaintStyle(layer);

    this.setModified();
  }

  setDataLayerPaletteInverted(layerId: string, paletteInverted: boolean): void {

    const layer = this.getDataLayer(layerId);
    if (!layer) throw new Error(`Data layer ${layerId} not found`);

    layer.paletteInverted = paletteInverted;
    this.regenerateLayerPaintStyle(layer);

    this.setModified();
  }

  setDataLayerFixedSize(layerId: string, size: number): void {

    const layer = this.getDataLayer(layerId);
    if (!layer) throw new Error(`Data layer ${layerId} not found`);

    layer.fixedSize = size;
    this.regenerateLayerPaintStyle(layer);

    if (layer.labelAttribute) {
      // Reposition label based on fixed size
      this.regenerateLabelLayer(layer);
    }

    this.setModified();
  }

  setDataLayerSizeAttribute(layerId: string, sizeAttribute: string): void {

    const layer = this.getDataLayer(layerId);
    if (!layer) throw new Error(`Data layer ${layerId} not found`);

    layer.sizeAttribute = sizeAttribute;
    this.regenerateLayerPaintStyle(layer);

    this.setModified();
  }

  setDataLayerSizeMode(layerId: string, sizeMode: 'attribute' | 'fixed'): void {

    const layer = this.getDataLayer(layerId);
    if (!layer) throw new Error(`Data layer ${layerId} not found`);

    layer.sizeMode = sizeMode;
    this.regenerateLayerPaintStyle(layer);

    this.setModified();
  }

  setDataLayerLabelAttribute(layerId: string, labelAttribute: string): void {

    const layer = this.getDataLayer(layerId);
    if (!layer) throw new Error(`Data layer ${layerId} not found`);

    layer.labelAttribute  = labelAttribute;
    this.regenerateLabelLayer(layer);

    this.setModified();
  }

  setBasemapDetail(level: number, setModified = true): void {
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

    if (setModified) this.setModified();
  }

  private setModified(): void {
    this._modified = true;
    this._modified$.next(true);
  }

  private regenerateLayerPaintStyle(layer: IMapLayer): void {
    this._regeneratePainStyle$.next(layer);
  }

  private regenerateLabelLayer(layer: IMapLayer): void {
    this._regenerateLabelLayer$.next(layer);
  }

  /**
   * Regenerate layer paint style and apply paint properties to map
   *
   * @param {IMapLayer} layer
   */
  private debouncedRegeneratePaintStyle(layer: IMapLayer): void {

    try {
      const paintStyle = this._styleGenerater.paintStyleForLayer(layer);
      Object.keys(paintStyle).forEach(key => {
        this.setPaintProperty(layer.layerId, key, paintStyle[key]);
      });
    }
    catch (e) {
      console.error('Style generation error', e);
    }
  }

  private debouncedRegenerateLabelLayer(layer: IMapLayer): void {

    // Remove old label layer
    const labelLayerId = LABEL_LAYER_PREFIX + layer.originalLayerId;
    const exisitingLabelLayer = this.getLayer(labelLayerId);
    if (exisitingLabelLayer) {
      this.removeLayer(labelLayerId);
    }

    if (layer.labelAttribute) {
      // Generate updated layer
      const labelLayer = this._styleGenerater.generateLabelLayer(layer, this._metadata.labelLayerStyle);

      debug(labelLayer);

      // Insert new label layer
      this.addLayer(labelLayer as MapboxLayer);
    }
  }

}
