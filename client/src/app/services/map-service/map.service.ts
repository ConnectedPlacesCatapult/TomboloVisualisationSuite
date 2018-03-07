import {Injectable} from "@angular/core";
import * as Debug from 'debug';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {NotificationService} from '../../dialogs/notification.service';
import {MapRegistry} from '../../mapbox/map-registry.service';
import {TomboloMapboxMap} from '../../mapbox/tombolo-mapbox-map';
import {FileUploadBase} from '../../../../../src/shared/fileupload-base';
import {OgrFileInfoBase} from '../../../../../src/shared/ogrfileinfo-base';
import {IMapGroup} from '../../../../../src/shared/IMapGroup';
import {ITomboloMap} from '../../../../../src/shared/ITomboloMap';
import {ITomboloDataset} from '../../../../../src/shared/ITomboloDataset';
import {IDatasetGroup} from '../../../../../src/shared/IDatasetGroup';
import {IBasemap} from '../../../../../src/shared/IBasemap';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/publishReplay';
import {IPalette} from '../../../../../src/shared/IPalette';
import {IStyle} from '../../../../../src/shared/IStyle';

const debug = Debug('tombolo:MapService');

export class OptimisticLockingError extends Error {
  constructor(message: string, public error: any) {
    super(message);

    // Set the prototype explicitly - required in Typescript when extending a built-in like Error
    Object.setPrototypeOf(this, OptimisticLockingError.prototype);
  }
}

@Injectable()
export class MapService {

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private mapRegistry: MapRegistry) {}

  private _mapLoaded$ = new Subject<TomboloMapboxMap>();
  private _mapLoading$ = new Subject<void>();
  private _basemaps$ : Observable<IBasemap[]>;
  private _palettes$ : Observable<IPalette[]>;

  mapLoaded$(): Observable<TomboloMapboxMap> {
    return this._mapLoaded$.asObservable();
  }

  mapLoading$(): Observable<void> {
    return this._mapLoading$.asObservable();
  }

  /**
   * Loads a map by id and sets the main-map style from the response
   * Clients can subscribe to the mapLoaded$ observable to be notified
   * when the map has been loaded.
   *
   * @param {string} mapId
   */
  loadMap(mapId: string): Promise<TomboloMapboxMap> {

    // Inform clients that the map is about to load
    this._mapLoading$.next();

    return Promise.all([
      this.mapRegistry.getMap<TomboloMapboxMap>('main-map'),
      this.http.get<IStyle>(`/maps/${mapId}/style.json`).toPromise()
    ])
      .then(([map, style]) => {
        map.beginLoad();
        return this.setStyleAndWait(map, style);
      })
      .then(map => {
        debug(`Map ${mapId} loaded.`);
        map.finalizeLoad();
        this._mapLoaded$.next(map);
        return map;
      })
      .catch(e => this.handleError(e));
  }

  saveMap(map: TomboloMapboxMap): Observable<IStyle> {
    return this.http.put<IStyle>(`/maps/${map.id}`, map.mapDefinition);
  }

  /**
   * Load maps groups and nested maps for populating left-hand navigation panel
   *
   * @returns {Promise<IMapGroup[]>}
   */
  loadMapGroups(): Observable<IMapGroup[]> {
    return this.http.get<IMapGroup[]>('/maps/grouped');
  }

  /**
   * Load dataset groups
   *
   * @returns {Promise<IDatasetGroup[]>}
   */
  loadDatasetGroups(): Observable<IDatasetGroup[]> {
    return this.http.get<IDatasetGroup[]>(`${environment.apiEndpoint}/datasets/groups`);
  }

  /**
   * Load datasets in specified group
   *
   * @returns {Promise<IDataset[]>}
   */
  loadDatasetsInGroup(groupId: string): Observable<ITomboloDataset[]> {
    return this.http.get<ITomboloDataset[]>(`${environment.apiEndpoint}/datasets/groups/${groupId}`);
  }

  /**
   * Load a dataset
   *
   * @returns {Promise<IDataset[]>}
   */
  loadDataset(datasetId: string): Observable<ITomboloDataset> {
    return this.http.get<ITomboloDataset>(`${environment.apiEndpoint}/datasets/${datasetId}`);
  }

  /**
   * Load (and cache) basemaps
   * @returns {Observable<IBasemap[]>}
   */
  loadBasemaps(): Observable<IBasemap[]> {

    // Cache basemaps
    if (!this._basemaps$) {
      this._basemaps$ = this.http.get<IBasemap[]>(`${environment.apiEndpoint}/basemaps`)
        .publishReplay(1)
        .refCount();
    }

    return this._basemaps$;
  }

  /**
   * Load (and cache) palettes
   * @returns {Observable<IPalette[]>}
   */
  loadPalettes(): Observable<IPalette[]> {

    // Cache palettes
    if (!this._palettes$) {
      this._palettes$ = this.http.get<IPalette[]>(`${environment.apiEndpoint}/palettes`)
        .publishReplay(1)
        .refCount();
    }

    return this._palettes$;
  }

  /**
   * Find datasets by full text search
   *
   * @returns {Promise<IDataset[]>}
   */
  findDatasetsByQuery(query: string): Observable<ITomboloDataset[]> {
    return this.http.get<ITomboloDataset[]>(`${environment.apiEndpoint}/datasets?query=${query}`);
  }

  /**
   * Load user's maps
   *
   * @returns {Promise<ITomboloMap[]>}
   */
  loadUserMaps(userId: string): Observable<ITomboloMap[]> {
    return this.http.get<ITomboloMap[]>(`/maps?userId=${userId}`);
  }

  /**
   * Load user's datasets
   *
   * @returns {Promise<IMapGroup[]>}
   */
  loadUserDatasets(userId: string): Observable<ITomboloDataset[]> {
    return this.http.get<ITomboloDataset[]>(`${environment.apiEndpoint}/datasets?userId=${userId}`);
  }

  /**
   * Loads maps referencing the given dataset
   *
   * Used to warn user when deleting a dataset that there are maps that reference it.
   *
   * @param {string} datsetId
   * @returns {Observable<ITomboloMap[]>}
   */
  loadMapsForDataset(datsetId: string): Observable<ITomboloMap[]> {
    return this.http.get<ITomboloMap[]>(`${environment.apiEndpoint}/datasets/${datsetId}/maps`);
  }

  /**
   * Delete map - user must be logged in and own map
   *
   * @param {string} mapId
   * @returns {Observable<void>}
   */
  deleteMap(mapId: string): Observable<void> {
    return this.http.delete<void>(`/maps/${mapId}`);
  }

  /**
   * Delete dataset - user must be logged in and own dataset
   *
   * @param {string} datasetId
   * @returns {Observable<void>}
   */
  deleteDataset(datasetId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiEndpoint}/datasets/${datasetId}`);
  }

  pollIngest(uploadID: string): Observable<FileUploadBase> {
    return this.http.get<FileUploadBase>(`${environment.apiEndpoint}/uploads/${uploadID}`);
  }

  finalizeIngest(uploadID: string, ogrInfo: OgrFileInfoBase): Observable<FileUploadBase> {
    return this.http.post<FileUploadBase>(`${environment.apiEndpoint}/uploads/${uploadID}`, ogrInfo);
  }

  createDataset(uploadID: string): Observable<any> {
    return this.http.get<Object>(`${environment.apiEndpoint}/uploads/${uploadID}/dataset`);
  }

  createMapForUpload(uploadID: string): Observable<any> {
    return this.http.get<Object>(`${environment.apiEndpoint}/uploads/${uploadID}/map`);
  }

  /**
   * Set a map style and wait for the 'style.load' event to fire. Used to prevent race conditions seen when
   * Trying to call getStyle() soon after setStyle()
   *
   * @param {TomboloMapboxMap} map
   * @param {TomboloMapStyle} style
   */
  private setStyleAndWait(map: TomboloMapboxMap, style: IStyle): Promise<TomboloMapboxMap> {
    return new Promise((resolve) => {
      map.once('style.load', () => {
        debug('Style loaded');
        resolve(map);
      });

      // Workaround for missing options parameter in @types/mapbox
      const untypedSetStyle: any = map.setStyle.bind(map);
      untypedSetStyle(style, {diff: false});
    });
  }

  /**
   * Error handling
   * @param e Error instance
   */
  private handleError(e): Promise<any> {
    if (e instanceof HttpErrorResponse && e.error.error && e.error.error.name === 'SequelizeOptimisticLockError') {
      e = new OptimisticLockingError(e.error.message, e.error.error);
    }

    if (!environment.production) {
      this.notificationService.error(e);
    }
    return Promise.reject(e);
  }
}
