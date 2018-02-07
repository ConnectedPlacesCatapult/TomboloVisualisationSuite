import {Component, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Style} from 'mapbox-gl';

const debug = Debug('tombolo:map-info');

@Component({
  selector: 'map-info',
  templateUrl: './map-info.html',
  styles: ['div {padding: 0.5em;}']
})
export class MapInfoComponent implements OnInit {

  constructor(private activatedRoute: ActivatedRoute, private httpClient: HttpClient) {}

  mapName: string;
  mapDescription: string;

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.loadMapInfo(params.mapID);
    });
  }

  ngOnDestroy() {
  }

  loadMapInfo(mapID: string) {
    debug('mapID:', mapID);
    if (!mapID) return;
    this.httpClient.get<Style>(`/maps/${mapID}/style.json`).subscribe(style => {
      this.mapName = style.name;
      this.mapDescription = style.metadata['description'];
    });
  }

}
