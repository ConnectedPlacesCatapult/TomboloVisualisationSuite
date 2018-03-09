import {Component, HostBinding, OnInit, ViewEncapsulation} from '@angular/core';
import * as Debug from 'debug';
import {TomboloMapboxMap} from '../../mapbox/tombolo-mapbox-map';
import {MapService} from '../../services/map-service/map.service';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from '../../mapbox/map-registry.service';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {FormControl, FormGroup} from '@angular/forms';
import {IMapFilter} from '../../../../../src/shared/IMapFilter';

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
              private mapRegistry: MapRegistry) {
    this.form = new FormGroup({
      transportMode: new FormControl(),
      journeyTime: new FormControl(),
      satisfaction: new FormControl(),
      gpRatio: new FormControl()
    });
  }

  map: TomboloMapboxMap;
  mapName: string;
  mapDescription: string;
  descriptionExpanded: 'expanded' | 'collapsed' = 'collapsed';
  form: FormGroup;

  accessLayerId: string;
  satisfactionFilter: IMapFilter;
  gpRatioFilter: IMapFilter;
  prescSetFilter: IMapFilter;

  private _subs: Subscription[] = [];

  ngOnInit() {

    // Initial setting of name and description
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      if (map.mapLoaded) {
        this.map = map;
      }
    });

    // Update name and description when map is loaded
    this._subs.push(this.mapService.mapLoaded$().subscribe(map => {
      this.map = map;
      this.updateFormFromMap(map);
    }));

    this._subs.push(this.mapService.mapLoading$().subscribe(map => {
      this.map = null;
      this.accessLayerId = null;
      this.satisfactionFilter = null;
      this.gpRatioFilter = null;
      this.prescSetFilter = null;
    }));

    this._subs.push(this.form.get('transportMode').valueChanges.subscribe(val => {
      this.map.setDataLayerColorAttribute(this.accessLayerId, val + this.form.get('journeyTime').value);
    }));

    this._subs.push(this.form.get('journeyTime').valueChanges.subscribe(val => {
      this.map.setDataLayerColorAttribute(this.accessLayerId, this.form.get('transportMode').value + val);
    }));

    this._subs.push(this.form.get('satisfaction').valueChanges.subscribe(val => {
      this.satisfactionFilter.value = val;
      this.satisfactionFilter.enabled = val > 0;
      this.map.updateFilter(0, this.satisfactionFilter);
    }));

    this._subs.push(this.form.get('gpRatio').valueChanges.subscribe(val => {
      this.gpRatioFilter.value = val;
      this.map.updateFilter(1, this.gpRatioFilter);
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

  // Update UI from map after load
  private updateFormFromMap(map: TomboloMapboxMap): void {

    let transportMode = 'wlk';
    let journeyTime = 5;
    let satisfaction: number = 0;
    let gpRatio: number = 0;

    map.dataLayers.forEach(l => {
      debug(`type: ${l.layerType}, attr:${l.colorAttribute}`);

      if (l.layerType === 'line') {
        // Extract transport mode and journey time
        this.accessLayerId = l.layerId;
        transportMode = l.colorAttribute.substring(0, 3);
        journeyTime = +l.colorAttribute.substring(3);
      }
      else if (l.layerType === 'circle') {
        // Capture filters and extract satisfaction and gp ratio
        const filters = map.filters.filter(f => f.datalayerId === l.layerId);

        if (filters && filters.length === 3) {
          this.satisfactionFilter = filters[0];
          this.gpRatioFilter = filters[1];
          this.prescSetFilter = filters[2];

          satisfaction = this.satisfactionFilter.value;
          gpRatio = this.gpRatioFilter.value;
        }
        else {
          throw new Error(`Bad filters for AccessTo map ${map.id}`);
        }
      }
    });

    const formVals = {
      transportMode,
      journeyTime,
      satisfaction,
      gpRatio
    };

    this.form.setValue(formVals);
  }
}
