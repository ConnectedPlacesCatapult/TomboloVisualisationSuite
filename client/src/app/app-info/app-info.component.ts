import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';

const debug = Debug('tombolo:app-info');

@Component({
  selector: 'app-info',
  templateUrl: './app-info.html',
  styleUrls: ['./app-info.scss']
})
export class AppInfoComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  constructor() {}

  ngOnInit() {
  }

  ngOnDestroy() {
  }
}
