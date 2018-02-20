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
import {Angulartics2} from 'angulartics2';

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'maps-demo',
  templateUrl: './maps-demo.html',
  styles: []
})
export class MapsDemoComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;
  sliderValue: number = 4;
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

    this.mapService.loadMap(mapID).then(map => {
      map.setBasemapDetail(this.sliderValue);
    });
  }

  /* TODO - Following code is temporary demo!!!! */
  basemapSliderChanged(event) {

    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      map.setBasemapDetail(event.value);
    });
  }
}
