import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {TomboloMapboxMap} from '../mapbox/tombolo-mapbox-map';
import {MapService} from '../map-service/map.service';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from '../mapbox/map-registry.service';

const debug = Debug('tombolo:account-info');

@Component({
  selector: 'account-info',
  templateUrl: './account-info.html',
  styleUrls: ['./account-info.scss']
})
export class AccountInfoComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  constructor() {}

  ngOnInit() {
  }

  ngOnDestroy() {
  }
}
