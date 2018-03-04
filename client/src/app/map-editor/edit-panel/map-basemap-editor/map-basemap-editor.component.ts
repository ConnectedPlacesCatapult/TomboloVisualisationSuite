import {ChangeDetectionStrategy, Component, HostBinding, OnInit, ViewEncapsulation} from '@angular/core';
import * as Debug from 'debug';

const debug = Debug('tombolo:map-basemap-editor');

@Component({
  selector: 'map-basemap-editor',
  templateUrl: './map-basemap-editor.html',
  styleUrls: ['./map-basemap-editor.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MapBasemapEditorComponent implements OnInit {

  @HostBinding('class.basemap-editor') basemapEditorClass = true;

  constructor() {}

  ngOnInit() {
  }

  ngOnDestroy() {
  }
}
