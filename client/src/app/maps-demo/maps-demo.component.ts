import {Component, HostBinding, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Style} from 'mapbox-gl';

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'maps-demo',
  templateUrl: './maps-demo.html',
  styles: []
})
export class MapsDemoComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  maps$: Observable<object[]> = null;

  constructor(private mapRegistry: MapRegistry, private activatedRoute: ActivatedRoute, private httpClient: HttpClient) {}

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
    this.httpClient.get<Style>(`/maps/${mapID}/style.json`).subscribe(style => {
      this.mapRegistry.getMap('main-map').then(map => {
        map.setStyle(style);

        // Fly to default location if not set in URL
        const url = new URL(window.location.href);
        let zoom = url.searchParams.get('zoom');
        if (!zoom) {
          map.flyTo({center: style.center, zoom: style.zoom, bearing: style.bearing, pitch: style.pitch});
        }
      });
    });
  }

  /* TODO - Following code is temporary demo!!!! */
  sliderChanged(event) {

    this.mapRegistry.getMap('main-map').then(map => {

      const roadNetwork = map.getStyle().metadata['roadNetwork'];

      Object.keys(roadNetwork).forEach(key => {
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
         default:

            break;
        }
        map.setPaintProperty(key, prop, roadNetwork[key] <= event.value? 1 : 0);
      });
    });
  }

}
