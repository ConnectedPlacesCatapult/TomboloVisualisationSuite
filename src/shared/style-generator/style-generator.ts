import {IBasemap} from '../IBasemap';
import {IMapDefinition} from '../IMapDefinition';
import {ILabelLayerStyleMetadata, IStyle, IStyleMetadata} from '../IStyle';
import {IMapLayer} from '../IMapLayer';
import {ITomboloDataset} from '../ITomboloDataset';

import * as uuid from 'uuid/v4';


import {clone} from './clone';
import {IPalette} from '../IPalette';

export const DATA_LAYER_ID = 'data';
export const DATA_LAYER_PREFIX = 'datalayer-';
export const LABEL_LAYER_PREFIX = 'labellayer-';

const MIN_POINT_RADIUS = 3;

export class StyleGenerator {

  constructor(private mapDefinition: IMapDefinition) {}

  generateMapStyle(basemap: IBasemap) {

    let style = clone(basemap.style);

    style.metadata = style.metadata || {} as IStyleMetadata;
    style.metadata.mapDefinition = this.mapDefinition;
    style.zoom = this.mapDefinition.zoom || style.zoom;
    style.center = this.mapDefinition.center || style.center;
    style.sources = {...style['sources'], ...this.generateSources(this.mapDefinition)};
    style.sources = this.expandTileSources(this.mapDefinition.tileBaseUrl, style.sources);

    // Find layer indices of insertion points
    let insertionPoints = style.metadata.insertionPoints || {};

    // Create and insert map layers - done in reverse order
    // first layer in array is top-most on map
    const reversedLayers = [...this.mapDefinition.layers].reverse();
    reversedLayers.forEach(layer => {
      const layerStyle = this.generateMapLayer(layer);
      const insertionPoint = insertionPoints[layer.layerType];
      this.insertMapLayer(insertionPoint, style, layerStyle);
    });

    // Create and insert label layers
    const labelAttributeStyle = style.metadata.labelLayerStyle;
    if (!labelAttributeStyle) {
      throw new Error(`No label layer style for basemap ${basemap.name}`);
    }
    else {
      reversedLayers.filter(layer => layer.labelAttribute !== null).forEach(layer => {
        const labelLayerStyle = this.generateLabelLayer(layer, labelAttributeStyle);
        const insertionPoint = insertionPoints['label'];
        this.insertMapLayer(insertionPoint, style, labelLayerStyle);
      });
    }

    return style;
  }

  layoutStyleForLayer(layer: IMapLayer): object {
    return {
      'visibility': layer.visible ? 'visible' : 'none'
    };
  }

  paintStyleForLayer(layer: IMapLayer): object {

    const dataset = this.datasetForLayer(layer);

    if (layer.layerType === 'fill') {
      return {
        'fill-color': this.colorRampForLayer(layer),
        'fill-outline-color': 'white',
        'fill-opacity': ['interpolate', ['linear'], ['zoom'],
          dataset.minZoom, 0,
          dataset.minZoom + 0.5, layer.opacity || 1
        ]
      };
    }
    else if (layer.layerType === 'circle') {
      return {
        'circle-color': this.colorRampForLayer(layer),
        'circle-radius': this.radiusRampForLayer(layer),
        'circle-opacity': ['interpolate', ['linear'], ['zoom'],
          dataset.minZoom, 0,
          dataset.minZoom + 0.5, layer.opacity || 1
        ]
      };
    }
    else if (layer.layerType === 'line') {
      return {
        'line-color': this.colorRampForLayer(layer),
        'line-width': {
          base: 1.3,
          stops: [[10, 2], [20, 20]]
        },
        'line-opacity': ['interpolate', ['linear'], ['zoom'],
          dataset.minZoom, 0,
          dataset.minZoom + 0.5, layer.opacity || 1
        ]
      };
    }
  }

  generateMapLayer(layer: IMapLayer): object {

    const dataset = this.datasetForLayer(layer);

    return {
      id: layer.layerId,
      source: layer.datasetId,
      'source-layer':  DATA_LAYER_ID,
      type: layer.layerType,
      minzoom: dataset.minZoom,
      maxzoom: dataset.maxZoom,
      layout: this.layoutStyleForLayer(layer),
      paint: this.paintStyleForLayer(layer)
    };
  }

  generateLabelLayer(layer: IMapLayer, labelAttributeStyle: ILabelLayerStyleMetadata): object {

    // Do nothing of no label attribute
    if (!layer.labelAttribute) return null;

    const dataset = this.datasetForLayer(layer);

    if (!dataset) {
      throw new Error(`Layer'${layer.layerId} has no dataset`);
    }

    const labelAttribute = dataset.dataAttributes.find(d => d.field === layer.labelAttribute);
    const labelText = `{${labelAttribute.field}} ${labelAttribute.unit ? labelAttribute.unit : ''}`;

    let layout = {
      ...labelAttributeStyle.layout,
      'visibility': layer.visible ? 'visible' : 'none',

      // TODO - shouldn't need to override these - change the basemap label style
      'text-anchor': 'top',
      'text-justify': 'center',
      'text-offset': [0, 0],
      'text-field': labelText
    };

    let paint = {...labelAttributeStyle.paint};

    switch (layer.layerType) {
      case 'circle':
        paint['text-translate'] = [0, layer.fixedSize + 4];
        break;
      case 'line':
        layout['symbol-placement'] = 'line';
        break;
    }

    return {
      id: LABEL_LAYER_PREFIX + layer.originalLayerId,
      type: 'symbol',
      source: layer.datasetId,
      'source-layer': DATA_LAYER_ID,
      layout: layout,
      paint: paint,
      filter: ['has', layer.labelAttribute]
    };
  }

  insertMapLayer(insertionPoint: string, style: IStyle, layer: object): void {
    const index = style.layers.findIndex(l => l['id'] === insertionPoint);
    style['layers'].splice(index, 0, layer);
  }


  /**
   * Generate a default map layer for the given dataset
   *
   * @param {ITomboloDataset} dataset
   */
  generateDefaultDataLayer(dataset: ITomboloDataset, defaultPalette: IPalette): IMapLayer {

    const newId = uuid();

    let mapLayer: IMapLayer = {
      layerId: DATA_LAYER_PREFIX + newId,
      originalLayerId: newId,
      datasetId: dataset.id,
      name: dataset.name,
      description: dataset.description,
      visible: true,
      opacity: 1,
      layerType: this.layerTypeForGeometryType(dataset.geometryType),
      palette: defaultPalette,
      paletteInverted: false,
      colorAttribute: null,
      fixedColor: '#888',
      colorMode: 'fixed',
      sizeAttribute: null,
      fixedSize: 10,
      sizeMode: 'fixed',
      labelAttribute: null,
      order: null,
    };

    return mapLayer;
  }

  private generateSources(mapDefinition: IMapDefinition): object {
    return  mapDefinition.layers.reduce((accum, layer) => {
      accum[layer.datasetId] = this.generateMapStyleSource(layer);
      return accum;
    }, {});
  }
  private generateMapStyleSource(layer: IMapLayer): object {
    return {
      type: 'vector',
      url: `${layer.datasetId}/index.json`
    };
  }

  private expandTileSources(baseUrl: string, sources: object): object {
    return Object.keys(sources).reduce((accum, key) => {
      let source = sources[key];

      // For vector source with tileJSON url
      if (source.hasOwnProperty('url')) {
        source = {...source, url: this.expandRelativeTileURL(baseUrl, source['url'])};
      }

      // For vector sources with inline tiles url
      if (source.hasOwnProperty('tiles')) {
        source = {...source, tiles: source['tiles'].map(tileUrl => this.expandRelativeTileURL(baseUrl, tileUrl))};
      }

      // For geojson sources
      if (source.hasOwnProperty('data')) {
        source = {...source, data: this.expandRelativeTileURL(baseUrl, source['data'])};
      }

      accum[key] = source;

      return accum;
    }, {});
  }

  private expandRelativeTileURL(baseUrl, url: string): string {
    return (url.startsWith('http')) ? url : baseUrl + url;
  }

  private datasetForLayer(layer: IMapLayer): ITomboloDataset {
    return this.mapDefinition.datasets.find(ds => ds.id === layer.datasetId);
  }

  private colorRampForLayer(layer: IMapLayer): any {

    // Fixed color
    if (layer.colorMode === 'fixed' || !layer.colorAttribute) {
      return layer.fixedColor || 'black';
    }

    // Data-driven color
    const dataset = this.datasetForLayer(layer);

    if (!dataset) {
      throw new Error(`Layer'${layer.layerId} has no dataset`);
    }

    const dataAttribute = dataset.dataAttributes.find(d => d.field === layer.colorAttribute);

    if (!dataAttribute) {
      throw new Error(`Data attribute '${layer.colorAttribute} not found on dataset`);
    }

    if (!dataAttribute.quantiles5) {
      // Missing quantiles
      return 'black';
    }

    const colorStops = [...layer.palette.colorStops];
    if (layer.paletteInverted) colorStops.reverse();
    const rampStops = dataAttribute.quantiles5.map((val, i) => [val, colorStops[i]]);
    const defaultColor = colorStops[0];

    // TODO - convert to new-style expression once I've figured out how to replicate the 'default' value for missing data
    const ramp =  {
      property: layer.colorAttribute,
      stops: rampStops,
      'default': layer.fixedColor || defaultColor
    };

    return ramp;
  }

  private radiusRampForLayer(layer: IMapLayer): any {

    // Fixed radius
    if (layer.sizeMode === 'fixed' || !layer.sizeAttribute) {
      return layer.fixedSize;
    }

    // Data-driven radius
    const dataset = this.datasetForLayer(layer);
    const dataAttribute = dataset.dataAttributes.find(d => d.field === layer.sizeAttribute);

    if (!dataAttribute) {
      throw new Error(`Data attribute '${layer.sizeAttribute} not found on dataset`);
    }

    const radiusRange = layer.fixedSize - MIN_POINT_RADIUS;
    const radiusPerStop = radiusRange / 5;

    const stops = dataAttribute.quantiles5.map((val, i) => [val, MIN_POINT_RADIUS + radiusPerStop * i]).reduce((a, b) => a.concat(b), []);

    return [
      'interpolate',
      ['linear'],
      ['number', ['get', layer.sizeAttribute], layer.fixedSize],
      ...stops
    ];
  }

  private layerTypeForGeometryType(geometryType: string): 'circle' | 'line' | 'fill' {
    switch (geometryType) {
      case 'ST_MultiPoint': return 'circle';
      case 'ST_Point': return 'circle';
      case 'ST_MultiLineString': return 'line';
      case 'ST_LineString': return 'line';
      case 'ST_MultiPolygon': return 'fill';
      case 'ST_Polygon': return 'fill';
    }
  }
}
