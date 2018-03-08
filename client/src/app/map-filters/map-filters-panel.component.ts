import {ChangeDetectionStrategy, Component, HostBinding, OnInit, DoCheck, ChangeDetectorRef} from '@angular/core';
import * as Debug from 'debug';
import {TomboloMapboxMap} from '../mapbox/tombolo-mapbox-map';
import {MapService} from '../services/map-service/map.service';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {IMapLayer} from '../../../../src/shared/IMapLayer';
import {DialogsService} from '../dialogs/dialogs.service';
import {DragulaService} from 'ng2-dragula';
import {NotificationService} from '../dialogs/notification.service';
import {IMapFilter} from '../../../../src/shared/IMapFilter';

const debug = Debug('tombolo:map-filters-panel');

@Component({
  selector: 'map-filters',
  templateUrl: './map-filters-panel.html',
  styleUrls: ['./map-filters-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapFiltersPanelComponent implements OnInit, DoCheck {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  constructor(private mapService: MapService,
              private mapRegistry: MapRegistry,
              private dialogsService: DialogsService,
              private notificationService: NotificationService,
              private cd: ChangeDetectorRef) {}

  _subs: Subscription[] = [];
  map: TomboloMapboxMap;
  filters: IMapFilter[];

  ngOnInit() {

    // Initial setting of map
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      debug('initial settting of map', map.mapLoaded);
      if (map.mapLoaded) {
        this.map = map;
        this.filters = map.filters;
        this.cd.markForCheck();
      }
    });

    this._subs.push(this.mapService.mapLoading$().subscribe(() => {
      debug('Map is loading');
      // Clear map so that child components don't try to access map
      // while it is loading
      this.map = null;
      this.filters = null;
      this.cd.markForCheck();
    }));

    // Update when map loaded
    this._subs.push(this.mapService.mapLoaded$().subscribe(map => {
      debug('Edit panel got map', map.id);
      this.map = map;
      this.filters = map.filters;


      debug(this.filters);

      this.cd.markForCheck();
    }));

  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  // Custom change detection to detect filter changes on map
  // due to inserts, deletions etc.
  ngDoCheck() {
    if (this.map && this.map.filters !== this.filters) {
      this.filters = this.map.filters;
      this.cd.markForCheck();
    }
  }

  eyeIconForFilter(filter: IMapFilter): string {
    return filter.enabled ? 'eye' : 'eye-off';
  }

  toggleFilterEnabled(filter: IMapFilter) {
   // this.map.setFilterEnabled(filter, !filter.enabled);
  }

  deleteFilter(filter: IMapFilter) {
    this.dialogsService
      .confirm('Delete Filter', `Are you sure you want to delete the filter?`)
      .filter(result => result)
      .subscribe(() => {
       // this.map.removeFilter(filter);
      });
  }

  onFilterChange(index: number, newFilter: IMapFilter) {
    debug(`Filter changed at index ${index}`, newFilter);
  }
}
