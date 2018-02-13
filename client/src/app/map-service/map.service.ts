import {Injectable} from "@angular/core";
import * as Debug from 'debug';
import {Observable} from 'rxjs/Observable';
import Style = mapboxgl.Style;
import {Subject} from 'rxjs/Subject';
import {environment} from '../../environments/environment';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {NotificationService} from '../dialogs/notification.service';

import 'rxjs/add/operator/do';

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

  constructor(private http: HttpClient, private notificationService: NotificationService) {}

  private _mapLoaded$ = new Subject<Style>();

  mapLoaded$(): Observable<Style> {
    return this._mapLoaded$.asObservable();
  }

  loadMap(mapId: string): Promise<Style> {
    return this.http.get<Style>(`/maps/${mapId}/style.json`, {withCredentials: true})
      .do(style => {
        debug(`Map ${mapId} loaded.`);
        this._mapLoaded$.next(style);
      })
      .catch(e => this.handleError(e)).toPromise();
  }

  /**
   * Error handling
   * @param e Error instance
   * @returns {Observable<any>}
   */
  private handleError(e): Observable<any> {
    if (e instanceof HttpErrorResponse && e.error.error && e.error.error.name === 'SequelizeOptimisticLockError') {
      e = new OptimisticLockingError(e.error.message, e.error.error);
    }

    if (!environment.production) {
      this.notificationService.error(e);
    }
    return Observable.throw(e);
  }
}
