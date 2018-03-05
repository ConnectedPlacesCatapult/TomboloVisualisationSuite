import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {TomboloMapboxMap} from '../../mapbox/tombolo-mapbox-map';
import {MapService} from '../../services/map-service/map.service';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from '../../mapbox/map-registry.service';

const debug = Debug('tombolo:map-info');

@Component({
  selector: 'map-info',
  templateUrl: './map-info.html',
  styleUrls: ['./map-info.scss']
})
export class MapInfoComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  constructor(private mapService: MapService,
              private mapRegistry: MapRegistry) {}

  mapName: string;
  mapDescription: string;
  mapServiceSubscription: Subscription;

  ngOnInit() {

    // Initial setting of name and description
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      if (map.mapLoaded) {
        this.mapName = map.name;
        this.mapDescription = map.description;
      }
    });

    // Update name and description when map is loaded
    this.mapServiceSubscription = this.mapService.mapLoaded$().subscribe(map => {
      this.mapName = map.name;
      this.mapDescription = map.description;
    });
  }

  ngOnDestroy() {
    this.mapServiceSubscription.unsubscribe();
  }
}
