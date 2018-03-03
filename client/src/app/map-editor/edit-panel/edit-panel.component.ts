import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {TomboloMapboxMap} from '../../mapbox/tombolo-mapbox-map';
import {MapService} from '../../services/map-service/map.service';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from '../../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';

const debug = Debug('tombolo:map-info');

@Component({
  selector: 'map-info',
  templateUrl: './edit-panel.html',
  styleUrls: ['./edit-panel.scss']
})
export class EditPanelComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  constructor(private mapService: MapService,
              private mapRegistry: MapRegistry) {}

  _subs: Subscription[] = [];

  ngOnInit() {

  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

}
