import {ChangeDetectionStrategy, Component, HostBinding, Input, OnInit, ViewEncapsulation} from '@angular/core';
import * as Debug from 'debug';
import {TomboloMapboxMap} from '../../../mapbox/tombolo-mapbox-map';
import {IBasemap} from '../../../../../../src/shared/IBasemap';

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

  @Input() map: TomboloMapboxMap;
  @Input() basemaps: IBasemap[];

  constructor() {}

  ngOnInit() {
  }

  ngOnDestroy() {
  }
}
