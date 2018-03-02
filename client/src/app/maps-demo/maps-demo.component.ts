import {Component, HostBinding, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Style} from 'mapbox-gl';
import {MapService} from '../map-service/map.service';
import {TomboloMapboxMap, TomboloMapStyle} from '../mapbox/tombolo-mapbox-map';
import {Angulartics2} from 'angulartics2';
import {IMapGroup} from '../../../../src/shared/IMapGroup';
import {GeosearchItem} from '../geosearch/geosearch.service';
import LngLatBoundsLike = mapboxgl.LngLatBoundsLike;

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'maps-demo',
  templateUrl: './maps-demo.html',
  styles: []
})
export class MapsDemoComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  maps$: Observable<object[]> = null;

  mapGroups$: Observable<IMapGroup[]> = null;

  constructor(private mapRegistry: MapRegistry,
              private activatedRoute: ActivatedRoute,
              private mapService: MapService,
              private router: Router) {}

  ngOnInit() {
    this.mapGroups$ = this.mapService.loadMapGroups();
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
      //map.setBasemapDetail(this.sliderValue);
    });
  }

  geosearchSelected(item: GeosearchItem) {
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      map.fitBounds(item.boundingBox, {padding: 30, maxZoom: 13});
    });
  }

  gotoPlayground() {
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      this.router.navigate(['/',{outlets:{
        primary:['edit', map.id],
        loginBar: null,
        rightBar:['editpanel']}}], {
        preserveQueryParams: true
      });
    });
  }

}
