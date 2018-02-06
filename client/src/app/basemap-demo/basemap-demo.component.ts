import {Component, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';

const debug = Debug('tombolo:basemap-demo');

@Component({
  selector: 'basemap-demo',
  templateUrl: './basemap-demo.html',
  styles: [':host{flex-direction:column; height: 100%;}'],
  animations: [
    trigger('fadeIn', [
      state('*', style({opacity: 1})),
      state('void', style({opacity: 0})),
      transition(':enter', [
        animate('200ms 500ms'),
      ])
    ])
  ]
})
export class BasemapDemoComponent implements OnInit {

  constructor(private mapRegistry: MapRegistry, private activatedRoute: ActivatedRoute) {}

  selectedBasemapId = '';

  baseMaps = [
    {
      id: 'fjord',
      name: 'Fjord',
      styleUrl: 'https://maps.emu-analytics.net:4430/styles/fjord.json'
    },
    {
      id: 'positron',
      name: 'Positron',
      styleUrl: 'https://maps.emu-analytics.net:4430/styles/positron.json'
    },
    {
      id: 'darkmatter',
      name: 'Dark Matter',
      styleUrl: 'https://maps.emu-analytics.net:4430/styles/darkmatter.json'
    },
    {
      id: 'osm',
      name: 'OSM Bright',
      styleUrl: 'https://maps.emu-analytics.net:4430/styles/osmbright2.json'
    }
  ]

  ngOnInit() {
    this.activatedRoute.data.subscribe(data => this.selectBasemap(this.selectedBasemapId));

    debug('hello');
    this.selectBasemap('fjord');
  }

  ngOnDestroy() {
  }

  selectBasemap(basemapId: string) {


    if (basemapId === this.selectedBasemapId) {
      return;
    }

    this.selectedBasemapId = basemapId;

    this.mapRegistry.getMap('main-map').then((map) => {
      let basemap = this.baseMaps.find(basemap => basemap.id == basemapId);
      map.setStyle(basemap.styleUrl);
    });

    debug(`Selected basemap: ${basemapId}`);

    return false;
  }

}
