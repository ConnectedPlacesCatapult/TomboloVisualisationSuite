/** Tooltip Render Service **/

import {Injectable} from '@angular/core';
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

@Injectable()
export class TooltipRenderService {

  private _tooltipData: object;
  private _tooltipUpdate = new Subject<object>();
  componentInstance;

  setTooltip(attributes: object, lngLat: mapboxgl.LngLatLike): void {
    this._tooltipData = {attributes: attributes, lngLat: lngLat};
    this._notifyTooltipUpdate();
  }

  private _notifyTooltipUpdate(): void {
    this._tooltipUpdate.next(this._tooltipData);
  }

  tooltipUpdated(): Observable<object> {
    return this._tooltipUpdate.asObservable();
  }

}
