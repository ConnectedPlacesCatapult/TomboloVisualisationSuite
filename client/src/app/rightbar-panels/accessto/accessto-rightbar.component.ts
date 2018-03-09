import {Component, HostBinding, OnInit, ViewEncapsulation} from '@angular/core';
import * as Debug from 'debug';
import {TomboloMapboxMap} from '../../mapbox/tombolo-mapbox-map';
import {MapService} from '../../services/map-service/map.service';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from '../../mapbox/map-registry.service';
import {animate, state, style, transition, trigger} from '@angular/animations';

const debug = Debug('tombolo:access-to');

@Component({
  selector: 'access-to',
  templateUrl: './accessto.html',
  styleUrls: ['./accessto.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('expandedState', [
      state('expanded', style({
        height: '*'
      })),
      state('collapsed',   style({
        height: '180px'
      })),
      transition('collapsed <=> expanded', animate('100ms ease-in-out'))
    ])
  ]
})
export class AccesstoRightBarComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;
  @HostBinding('class.access-to') accessToClass = true;

  constructor(private mapService: MapService,
              private mapRegistry: MapRegistry) {}

  mapName: string;
  mapDescription: string;
  descriptionExpanded: 'expanded' | 'collapsed' = 'collapsed';

  private _subs: Subscription[] = [];

  ngOnInit() {

    // Initial setting of name and description
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      if (map.mapLoaded) {
        this.mapName = map.name;
        this.mapDescription = map.description;
      }
    });

    // Update name and description when map is loaded
    this._subs.push(this.mapService.mapLoaded$().subscribe(map => {
      this.mapName = map.name;
      this.mapDescription = map.description;
    }));
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  toggleDescriptionExpanded() {
    switch (this.descriptionExpanded) {
      case 'collapsed':
        this.descriptionExpanded = 'expanded';
        break;
      case 'expanded':
        this.descriptionExpanded = 'collapsed';
        break;
    }
  }

  expandButtonText(): string {
    return (this.descriptionExpanded === 'expanded') ? 'Less...' : 'More...';
  }
}
