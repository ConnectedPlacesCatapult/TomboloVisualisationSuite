import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import * as Debug from 'debug';

const debug = Debug('tombolo:map-basemap-editor');

@Component({
  selector: 'map-basemap-editor',
  templateUrl: './map-basemap-editor.html',
  styleUrls: ['./map-basemap-editor.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapBasemapEditorComponent implements OnInit {

  constructor() {}

  ngOnInit() {
  }

  ngOnDestroy() {
  }
}
