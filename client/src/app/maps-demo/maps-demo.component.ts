import {Component, HostBinding, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Style} from 'mapbox-gl';
import {MapService} from '../map-service/map.service';
import {TomboloMapboxMap, TomboloMapStyle} from '../mapbox/tombolo-mapbox-map';

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'maps-demo',
  templateUrl: './maps-demo.html',
  styles: []
})
export class MapsDemoComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  maps$: Observable<object[]> = null;

  constructor(private mapRegistry: MapRegistry,
              private activatedRoute: ActivatedRoute,
              private httpClient: HttpClient,
              private mapService: MapService) {}

  ngOnInit() {
    this.maps$ = this.httpClient.get<object[]>('/maps');
    this.activatedRoute.params.subscribe(params => {
      this.loadMap(params.mapID);
    });
  }

  ngOnDestroy() {
  }

  loadMap(mapID: string) {
    debug('mapID:', mapID);
    if (!mapID) return;

    this.mapService.loadMap(mapID);
  }

  /* TODO - Following code is temporary demo!!!! */
  basemapSliderChanged(event) {

    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {

      const basemapDetail = map.getStyle().metadata.basemapDetail;

      if (!basemapDetail) return;

      Object.keys(basemapDetail.layers).forEach(key => {
        const layer = map.getLayer(key);
        if (!layer) throw new Error(`Unknown layer ${key}`);
        let prop: string;
        switch (layer.type) {
          case 'line':
            prop = 'line-opacity';
            break;
          case 'symbol':
            prop = 'text-opacity';
            break;
          case 'fill':
            prop = 'fill-opacity';
            break;
          default:
            debug(`Unsupported layer type for basemap detail: ${layer.type}`);
            break;
        }
        map.setPaintProperty(key, prop, basemapDetail.layers[key] <= event.value? 1 : 0);
      });
    });
  }

}
