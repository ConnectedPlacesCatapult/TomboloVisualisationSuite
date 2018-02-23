import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MapService} from '../map-service/map.service';
import {ICONS} from '../tombolo-theme/icons';

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'icons-demo',
  templateUrl: './icons-demo.html',
  styles: []
})
export class IconsDemoComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  icons = ICONS;

  constructor() {}

  ngOnInit() {

  }

  ngOnDestroy() {
  }

}
