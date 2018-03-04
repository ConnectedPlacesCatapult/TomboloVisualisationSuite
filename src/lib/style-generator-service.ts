import {Container, Service} from 'typedi';
import {Logger, LoggerService} from './logger';
import {TomboloMap} from '../db/models/TomboloMap';
import {TomboloMapLayer} from '../db/models/TomboloMapLayer';
import {IMapDefinition} from '../shared/IMapDefinition';
import {ITomboloDataset} from '../shared/ITomboloDataset';
import {IMapLayer} from '../shared/IMapLayer';
import {StyleGenerator} from '../shared/style-generator/style-generator';
import {IBasemap} from '../shared/IBasemap';

const { URL } = require('url');

const DATA_LAYER_PREFIX = 'datalayer-';
const LABEL_LAYER_PREFIX = 'labellayer-';

const MIN_POINT_RADIUS = 3;
const MAX_POINT_RADIUS = 20;

function ServiceFactory() {
  let styleGenerator = new StyleGenerator();
  let logger = Container.get(LoggerService);
  return new StyleGeneratorService(styleGenerator, logger);
}

/**
 * MapboxGL style generator
 *
 * https://www.mapbox.com/mapbox-gl-js/style-spec/
 */
@Service({factory: ServiceFactory})
export class StyleGeneratorService {

  constructor(private styleGenerator: StyleGenerator, private logger: Logger) {
  }

  /**
   * Generate a MapboxGL style for the specified map
   *
   * @param {TomboloMap} map
   * @param {string} baseUrl
   * @returns {Object}
   */
  generateMapStyle(map: TomboloMap, baseUrl: string): object {

    const mapDefinition = this.generateMapDefinition(map);

    // Delegate to shared styleGenerator
    return this.styleGenerator.generateMapStyle(map.basemap, mapDefinition, baseUrl);
  }

  /**
   * Generate portable map definition for map
   *
   * @param {TomboloMap} map
   * @returns {IMapDefinition}
   */
  generateMapDefinition(map: TomboloMap): IMapDefinition {
    let mapDefinition: IMapDefinition = {
      id: map.id,
      name: map.name,
      description: map.description,
      zoom: map.zoom,
      center: map.center,
      datasets: this.datasetsForMap(map),
      layers: this.datalayersForMap(map),
      recipe: map.recipe,
      basemapDetailLevel: map.basemapDetailLevel
    };

    return mapDefinition;
  }
  
  /**
   * Return datasets for map
   *
   * @param {TomboloMap} map
   * @returns {ITomboloDataset[]}
   */
  private datasetsForMap(map: TomboloMap): ITomboloDataset[] {

    // Reduce datasets from all map layers to remove duplicates
    const reducedDatasets: {[key: string]: ITomboloDataset} =  map.layers.reduce((accum, layer) => {
      const ds = layer.dataset;
      accum[ds.id] = {
        id: ds.id,
        name: ds.name,
        description: ds.description,
        geometryType: ds.geometryType,
        minZoom: ds.minZoom,
        maxZoom: ds.maxZoom,
        dataAttributes: layer.dataset.dataAttributes
          .sort((a, b) => a.order - b.order).map(attr => ({
          field: attr.field,
          name: attr.name,
          description: attr.description,
          unit: attr.unit,
          minValue: attr.minValue,
          maxValue: attr.maxValue,
          quantiles5: attr.quantiles5,
          quantiles10: attr.quantiles10,
          type: attr.type,
          categories: attr.categories
        }))
      };

      return accum;
    }, {});

    return Object.keys(reducedDatasets).map(key => reducedDatasets[key]);
  }

  /**
   * REturn data layers for map
   *
   * @param {TomboloMap} map
   * @returns {IMapLayer[]}
   */
  private datalayersForMap(map: TomboloMap): IMapLayer[] {

    return map.layers.map(layer => {
      const datalayer: IMapLayer = {
        layerId: layer.layerId,
        name: layer.name,
        description: layer.description,
        layerType: layer.layerType,
        palette: layer.palette,
        paletteInverted: layer.paletteInverted,
        datasetId: layer.datasetId,
        datasetAttribute: layer.datasetAttribute,
        labelAttribute: layer.labelAttribute,
        opacity: layer.opacity,
        order: layer.order
      };

      return datalayer;
    });
  }
}
