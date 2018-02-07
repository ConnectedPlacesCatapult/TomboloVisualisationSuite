import {Component, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Style} from 'mapbox-gl';

const debug = Debug('tombolo:basemap-demo');

@Component({
  selector: 'maps-demo',
  templateUrl: './maps-demo.html',
  styles: [':host{flex-direction:column; height: 100%;}']
})
export class MapsDemoComponent implements OnInit {

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
      debug(style);
      this.mapRegistry.getMap('main-map').then(map => {
        map.setStyle(style);
        map.flyTo({center: style.center, zoom: style.zoom, bearing: style.bearing, pitch: style.pitch})
      });
    });
  }

}
