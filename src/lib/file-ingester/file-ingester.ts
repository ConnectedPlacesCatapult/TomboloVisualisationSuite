import {Container, Service} from 'typedi';
import {Logger, LoggerService} from '../logger';
import {FileUpload} from '../../db/models/FileUpload';
import * as config from 'config';
import * as path from 'path';
import * as fs from 'fs';

const exec = require('child_process').exec;

interface FileInfo {
  id: string;
  path: string;
  driver: string;
  geometryType: string;
  featureCount: number;
  srs: string;
  attributes: {[key: string]: string | number}[];
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

  async processFile(file: FileUpload): Promise<FileInfo> {
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
      return null;
    }
  }

  /**
   * Validate given file is a supported geospatial file using ogrinfo
   *
   * @param {string} path
   */
  private validateFile(file: FileUpload): Promise<FileInfo> {

    const cmd = `ogrinfo -ro -al -so -oo FLATTEN_NESTED_ATTRIBUTES=yes ${file.path}`;

    this.logger.info(`Executing ogrinfo for upload: ${file.id}`, cmd);

    return new Promise((resolve, reject) => {
      exec(cmd, (err, stdout) => {
        if (err) {
          // ogrinfo error message is actually returned through stdout
          reject(new Error(stdout));
        }

        let fileInfo: FileInfo = {} as any;

        try {
          // Extract driver type
          const driverRegex = /using driver `(.*)'/;
          const driver = stdout.match(driverRegex);
          fileInfo.driver = driver ? driver[1] : null;

          // Extract key/value pairs
          const keyValueRegex = /([\w\d ]*):\s(.*)/gm;
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
              attributes.push({id: keys[i], type, precision});
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

  private ingestFile(file: FileUpload): Promise<void> {

    const database = this.dbConfig['database'];
    const host = this.dbConfig['host'];
    const port = this.dbConfig['port'];
    const username = this.dbConfig['username'];
    const password = this.dbConfig['password'];

    const cmd = `ogr2ogr -f "PostgreSQL" PG:"dbname='${database}' host='${host}' port='${port}' user='${username}' password='${password}'" \
    ${file.path} -t_srs EPSG:4326 -oo FLATTEN_NESTED_ATTRIBUTES=yes -nlt PROMOTE_TO_MULTI -nln ${file.id}-data`;

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
}
