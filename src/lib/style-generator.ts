import {Container, Service} from 'typedi';
import {Logger, LoggerService} from './logger';
import {TomboloMap} from '../db/models/TomboloMap';
import {TomboloMapLayer} from '../db/models/TomboloMapLayer';
import {DATA_LAYER_ID} from './tile-renderers/postgis-tile-renderer';

const { URL } = require('url');
const LAYER_PREFIX = 'datalayer-';

function ServiceFactory() {
  let logger = Container.get(LoggerService);
  return new StyleGenerator(logger);
}

/**
 * Sequelize wrapper class
 */
@Service({factory: ServiceFactory})
export class StyleGenerator {

  constructor(private logger: Logger) {
  }

  generateMapStyle(map: TomboloMap, baseUrl: string): object {
    let style = map.basemap.style;

    style['name'] = map.name;
    style['metadata']['description'] = map.description;

    style['zoom'] = map.zoom || style['zoom'];
    style['center'] = map.center || style['center'];

    style['sources'] = {...style['sources'], ...this.generateSources(map)};
    style['sources'] = this.expandTileSources(baseUrl, style['sources']);

    // Find layer indices of insertion points
    let insertionPoints = {...(style['metadata'] && style['metadata']['insertionPoints'])};
    Object.keys(insertionPoints).forEach(key => {
      const layers: object[] = style['layers'];
      const layerIndex = layers.findIndex(l => l['id'] === insertionPoints[key]);
      insertionPoints[key] = layerIndex;
    });

    // Create and insert map layers
    map.layers.forEach(layer => {
      const layerStyle = this.generateMapLayer(layer);
      const insertionPoint = insertionPoints[layer.layerType] || -1;
      this.insertMapLayer(insertionPoint, style, layerStyle);
    });

    return style;
  }

  private generateSources(map: TomboloMap): object {
    return  map.layers.reduce((accum, layer) => {
      accum[layer.datasetId] = this.generateMapStyleSource(layer);
      return accum;
    }, {});
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

  private generateMapStyleSource(layer: TomboloMapLayer): object {
    return {
      type: 'vector',
      url: `${layer.datasetId}/index.json`
    };
  }

  private generateMapLayer(layer: TomboloMapLayer): object {
    return {
      id: LAYER_PREFIX + layer.layerId,
      source: layer.datasetId,
      'source-layer':  DATA_LAYER_ID,
      type: layer.layerType,
      paint: this.paintStyleForLayer(layer),
      filter: ['has', layer.datasetAttribute]
    };
  }

  private paintStyleForLayer(layer: TomboloMapLayer): object {
    if (layer.layerType === 'fill') {
      return {
        'fill-color': this.colorRampForLayer(layer),
        'fill-outline-color': 'white'
      };
    }
    else if (layer.layerType === 'circle') {
      return {
        'circle-color': this.colorRampForLayer(layer),
        'circle-radius': this.radiusRampForLayer(layer)
      };
    }
    else if (layer.layerType === 'line') {
      return {
        'line-color': this.colorRampForLayer(layer),
        'line-width': {
          base: 1.3,
          stops: [[10, 2], [20, 20]]
        }
      };
    }
  }

  private colorRampForLayer(layer: TomboloMapLayer): object {

    const dataAttribute = layer.dataset.dataAttributes.find(d => d.field === layer.datasetAttribute);

    if (!dataAttribute) {
      throw new Error(`Data attribute '${layer.datasetAttribute} not found on dataset`);
    }

    const colorStops = layer.palette.colorStops;
    if (layer.paletteInverted) colorStops.reverse();

    const stops = dataAttribute.quantiles5.map((val, i) => [val, layer.palette.colorStops[i]]).reduce((a, b) => a.concat(b), []);

    return [
      'interpolate',
      ['linear'],
      ['get', layer.datasetAttribute],
      ...stops
    ];
  }

  private radiusRampForLayer(layer: TomboloMapLayer): object {

    const dataAttribute = layer.dataset.dataAttributes.find(d => d.field === layer.datasetAttribute);

    if (!dataAttribute) {
      throw new Error(`Data attribute '${layer.datasetAttribute} not found on dataset`);
    }

    const minRadius = 3;
    const maxRadius = 20;
    const radiusRange = maxRadius - minRadius;
    const radiusPerStop = radiusRange / 5;

    const stops = dataAttribute.quantiles5.map((val, i) => [val, minRadius + radiusPerStop * i]).reduce((a, b) => a.concat(b), []);

    return [
      'interpolate',
      ['linear'],
      ['get', layer.datasetAttribute],
      ...stops
    ];
  }

  private insertMapLayer(index: number, style: object, layer: object): void { 
    style['layers'].splice(index, 0, layer);
  }

  /**
   * Expand relative tile URLs
   */
  private expandRelativeTileURL(baseUrl, url: string): string {
    return (new URL(url, baseUrl)).toString();
  }


}
