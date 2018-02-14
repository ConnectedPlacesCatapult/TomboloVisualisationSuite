import {Injectable} from "@angular/core";
import * as Debug from 'debug';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {environment} from '../../environments/environment';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {NotificationService} from '../dialogs/notification.service';

import 'rxjs/add/operator/do';
import {MapRegistry} from '../mapbox/map-registry.service';
import {TomboloMapboxMap, TomboloMapStyle} from '../mapbox/tombolo-mapbox-map';

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

  mapLoaded$(): Observable<TomboloMapboxMap> {
    return this._mapLoaded$.asObservable();
  }

  /**
   * Loads a map by id and sets the main-map style from the response
   * Clients can subscribe to the mapLoaded$ observable to be notified
   * when the map has been loaded.
   *
   * @param {string} mapId
   * @returns {Promise<mapboxgl.Style>}
   */
  loadMap(mapId: string): Promise<TomboloMapboxMap> {

    return Promise.all([
      this.mapRegistry.getMap<TomboloMapboxMap>('main-map'),
      this.http.get<TomboloMapStyle>(`/maps/${mapId}/style.json`).toPromise()
    ])
      .then(([map, style]) => {
        return this.setStyleAndWait(map, style);
      })
      .then(map => {
        debug(`Map ${mapId} loaded.`);
        this._mapLoaded$.next(map);
        return map;
      })
      .catch(e => this.handleError(e));
  }


  private setStyleAndWait(map: TomboloMapboxMap, style: TomboloMapStyle): Promise<TomboloMapboxMap> {
    return new Promise((resolve, reject) => {
      map.once('style.load', () => {
        debug('Style loaded');
        resolve(map);
      });

      (map as any).setStyle(style, {diff: false});
    });
  }

  /**
   * Error handling
   * @param e Error instance
   * @returns {Observable<any>}
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
