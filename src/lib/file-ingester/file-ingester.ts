import {Container, Service} from 'typedi';
import {Logger, LoggerService} from '../logger';
import {FileUpload} from '../../db/models/FileUpload';
import * as config from 'config';
import * as path from 'path';
import * as fs from 'fs';
import {Dataset} from '../../db/models/Dataset';
import {DataAttribute} from '../../db/models/DataAttribute';
import {TomboloMap} from '../../db/models/TomboloMap';
import {BaseMap} from '../../db/models/BaseMap';
import {TomboloMapLayer} from '../../db/models/TomboloMapLayer';
import {Palette} from '../../db/models/Palette';
import * as sequelize from 'sequelize';
import {FileUploadBase} from '../../shared/fileupload-base';

const exec = require('child_process').exec;

export const DATATABLE_SUFFIX = '_data';

export interface OgrFileInfo {
  id: string;
  path: string;
  name?: string;
  description?: string;
  attribution?: string;
  removed?: boolean;
  driver: string;
  geometryType: string;
  featureCount: number;
  srs: string;
  attributes: OgrAttribute[];
}

export interface OgrAttribute {
  id: string;
  type: string;
  precision?: number;
  name?: string;
  description?: string;
  unit?: string;
  removed?: boolean;
}

/**
 * DI factory function to create service.
 */
function ServiceFactory() {
  let logger = Container.get(LoggerService);
  return new FileIngester(logger, config.get('db'));
}

@Service({factory: ServiceFactory})
export class FileIngester {

  constructor(private logger: Logger, private dbConfig: object) {}

  async processFile(file: FileUpload): Promise<OgrFileInfo> {

    if (!file) throw new Error('file required');

    try {
      // Handle zip file uploads using GDAL virtual file system
      const ext = path.extname(file.originalName);
      if (ext === '.zip') {
        const newPath = file.path + '.zip';
        fs.renameSync(file.path, newPath);
        file.path = '/vsizip/' + newPath;
      }

      // Validate file
      file.status = 'validating';
      await file.save();
      const fileInfo = await this.validateFile(file);

      // Ingest file
      await file.update({status: 'ingesting', ogrInfo: fileInfo});
      await this.ingestFile(file);

      await file.update({status: 'done'});

      return fileInfo;
    }
    catch (e) {
      this.logger.error(e.message);
      await file.update({status: 'error', error: e.message});

      // Do not return a rejected promise because no-one is listening
      // This is running detached and an unhandled rejected promise will
      // be fatal in future versions of node.
      throw e;
    }
  }

  async finalizeUpload(file: FileUpload, newOgrInfo: OgrFileInfo): Promise<void> {

    // Remove unwanted columns
    await Promise.all(newOgrInfo.attributes.filter(attr => attr.removed).map(attr => {
      const dropColumnSql = `ALTER TABLE ${file.sqlSafeTableName()} DROP COLUMN ${file.sqlSafeAttributeColumn(attr.id)};`;
      return file.sequelize.query(dropColumnSql);
    }));

    // Change column types
    await Promise.all(newOgrInfo.attributes
      .filter(attr => attr.type !== file.attributeType(attr.id))
      .map(attr => {

        let dataType;
        switch (attr.type) {
          case 'string':
            dataType = 'TEXT';
            break;
          case 'real':
            dataType = 'DOUBLE PRECISION';
            break;
          case 'integer':
            dataType = 'INTEGER';
            break;
          case 'datetime':
            dataType = 'TIMESTAMP WITH TIMEZONE';
            break;
          default:
            throw new Error(`Unsupported field type: ${attr.type}`);
        }

        const columnTypeSql = `
          ALTER TABLE ${file.sqlSafeTableName()} 
          ALTER COLUMN ${file.sqlSafeAttributeColumn(attr.id)} SET DATA TYPE ${dataType};`;
        return file.sequelize.query(columnTypeSql);
      }));

    return;
  }

  /**
   * Validate given file is a supported geospatial file using ogrinfo
   *
   * @param {string} path
   */
  validateFile(file: FileUploadBase): Promise<OgrFileInfo> {

    if (!file) return Promise.reject(new Error('file required'));

    const cmd = `ogrinfo -ro -al -so -oo FLATTEN_NESTED_ATTRIBUTES=yes ${file.path}`;

    this.logger.info(`Executing ogrinfo for upload: ${file.id}`, cmd);

    return new Promise((resolve, reject) => {
      exec(cmd, (err, stdout) => {
        if (err) {
          // ogrinfo error message is actually returned through stdout
          reject(new Error(this.interpretOgInfo(stdout)));
        }

        let fileInfo: OgrFileInfo = {} as any;

        try {
          // Extract driver type
          const driverRegex = /using driver `(.*)'/;
          const driver = stdout.match(driverRegex);
          fileInfo.driver = driver ? driver[1] : null;

          // Extract key/value pairs
          const keyValueRegex = /^(.*):\s(.*)$/gm;
          let keys = [];
          let keyValues = {};
          let temp;
          while ((temp = keyValueRegex.exec(stdout)) !== null) {
            keys.push(temp[1]);
            keyValues[temp[1]] = temp[2];
          }

          // Extract layer info
          fileInfo.geometryType = keyValues['Geometry'];
          fileInfo.featureCount = +keyValues['Feature Count'];

          let srs = keyValues['Layer SRS WKT'].match(/"(.*)"/);
          if (srs) fileInfo.srs = srs[1];

          // Extract data attributes
          let attributes = [];
          const attributeStartIndex = keys.indexOf('Layer SRS WKT');
          if (attributeStartIndex > -1) {
            for (let i = attributeStartIndex + 1; i < keys.length; i++) {
              const key = keys[i];
              const value = keyValues[key];
              const type = value.match(/^(\w*)/)[1].toLowerCase();
              const precision = +(value.match(/\((.*)\)/)[1]);
              attributes.push({id: keys[i].toLowerCase(), type, precision});
            }
          }

          fileInfo.attributes = attributes;

          resolve(fileInfo);
        }
        catch (e) {
          reject(e);
        }
      });
    });
  }

  ingestFile(file: FileUploadBase): Promise<void> {

    if (!file) return Promise.reject(Error('file required'));

    const database = this.dbConfig['database'];
    const host = this.dbConfig['host'];
    const port = this.dbConfig['port'];
    const username = this.dbConfig['username'];
    const password = this.dbConfig['password'];

    const cmd = `ogr2ogr -f "PostgreSQL" PG:"dbname='${database}' host='${host}' port='${port}' user='${username}' password='${password}'" \
    ${file.path} -t_srs EPSG:4326 -oo FLATTEN_NESTED_ATTRIBUTES=yes -nlt PROMOTE_TO_MULTI -nln ${file.id}${DATATABLE_SUFFIX}`;

    this.logger.info(`Executing ogr2ogr for upload: ${file.id}`, cmd);

    return new Promise((resolve, reject) => {
      let env = {...process.env};
      env['PG_USE_COPY'] = 'YES';
      exec(cmd, {env}, (err, stdout) => {
        if (err) {
          // ogr2ogr error message is actually returned through stdout
          reject(new Error(stdout));
        }

        // ogr2ogr gives no output if successful
        resolve();
      });
    });
  }

  async generateDataset(file: FileUpload): Promise<Dataset> {

    if (!file) return Promise.reject(Error('file required'));

    const geometryType = await this.queryGeometryType(file);

    // Create dataset
    const dataset = await Dataset.create<Dataset>({
      name: file.ogrInfo.name,
      description: file.ogrInfo.description,
      attribution: file.ogrInfo.attribution,
      sourceType: 'table',
      source: file.tableName(),
      geometryColumn: 'wkb_geometry',
      geometryType: geometryType,
      originalBytes: file.size,
      isPrivate: false
    });

    await file.$set('dataset', dataset);

    // Create data attributes
    await Promise.all(file.ogrInfo.attributes.filter(attr => !attr.removed).map((attr, index) => {

      // Convert attr type to javascript type
      const datasetType = (attr.type === 'real' || attr.type === 'integer') ? 'number' : attr.type;

      return dataset.$create('dataAttribute', {
        datasetId: dataset.id,
          field: attr.id,
        type: datasetType,
        name: attr.name,
        description: attr.description,
        unit: attr.unit,
        order: index
      });
    }));

    // Calculate dataset stats, extent and dataset size
    await dataset.calculateDataAttributeStats();
    await dataset.calculateGeometryExtent();
    await dataset.calculateDatasetBytes();
    await dataset.reload({include: [DataAttribute]});

    return dataset;
  }

  async generateMap(file: FileUpload): Promise<TomboloMap> {

    const basemap = await BaseMap.getDefault();
    const palette = await Palette.getDefault();

    const [lng, lat, zoom] = this.centerAndZoomFromExtent(file.dataset.extent);

    // Create map
    const map = await TomboloMap.create<TomboloMap>({
      name: file.dataset.name,
      description: file.dataset.description,
      center: [lng, lat],
      zoom: zoom,
      basemapId: (basemap) ? basemap.id : null
    });

    await file.$set('map', map);

    // Sort attributes with 'number' attributes first and then by order
    const sortedAttributes = file.dataset.dataAttributes.sort((a, b) => {
      if (a.type === b.type) return a.order - b.order;
      if (a.type === 'number') return -1;
      if (b.type === 'number') return 1;

      return a.order - b.order;
    });

    // Create map layer
    const layer = await map.$create<TomboloMapLayer>('layer', {
      name: file.dataset.name,
      datasetId: file.dataset.id,
      paletteId: (palette) ? palette.id : null,
      datasetAttribute: (sortedAttributes.length) ? sortedAttributes[0].field : null,
      layerType: this.layerTypeForGeometryType(file.dataset.geometryType)
    });

    return map;
  }

  private queryGeometryType(file: FileUpload) {
    const geometryTypeSql = `SELECT ST_GeometryType("wkb_geometry") as geometrytype from ${file.sqlSafeTableName()} limit 1;`;
    return file.sequelize.query(geometryTypeSql, {type: sequelize.QueryTypes.SELECT}).then(result => {

      return result[0]['geometrytype'];
    });
  }

  private layerTypeForGeometryType(geometryType: string): string {
    switch (geometryType) {
      case 'ST_MultiPoint': return 'circle';
      case 'ST_Point': return 'circle';
      case 'ST_MultiLineString': return 'line';
      case 'ST_LineString': return 'line';
      case 'ST_MultiPolygon': return 'fill';
      case 'ST_Polygon': return 'fill';
    }
  }

  private centerAndZoomFromExtent(extent: number[]): number[] {
    const centerLng = (extent[2] - extent[0]) / 2 + extent[0];
    const centerLat = (extent[3] - extent[1]) / 2 + extent[1];

    // TODO Calculate zoom

    return [centerLng, centerLat, 8];
  }

  private interpretOgInfo(ogInfo) {
    if (ogInfo.search('with the following drivers') !== -1) {
      return 'The datasource is not in a supported format.';
    }
    return ogInfo;
  }
}
