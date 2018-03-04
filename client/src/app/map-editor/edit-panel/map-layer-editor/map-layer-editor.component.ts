import {
  ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, OnInit,
  ViewEncapsulation
} from '@angular/core';
import * as Debug from 'debug';
import {TomboloMapboxMap} from '../../../mapbox/tombolo-mapbox-map';
import {FormControl, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs/Subscription';
import {IPalette} from '../../../../../../src/shared/IPalette';

const debug = Debug('tombolo:map-layer-editor');

@Component({
  selector: 'map-layer-editor',
  templateUrl: './map-layer-editor.html',
  styleUrls: ['./map-layer-editor.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MapLayerEditorComponent implements OnInit, OnChanges {

  @HostBinding('class.layer-editor') layerEditorClass = true;

  @Input() map: TomboloMapboxMap;
  @Input() palettes: IPalette[];
  @Input() layerId: string;
  @Input() mode: 'fill' | 'line' | 'circle';

  form: FormGroup;

  _subs: Subscription[] = [];

  constructor() {
    this.form = new FormGroup({
      colorRadio: new FormControl('fixed'),
      fixedColor: new FormControl('#bbb'),
      colorAttribute: new FormControl(),
      palette: new FormControl(),
      size: new FormControl(5),
      sizeRadio: new FormControl('fixed'),
      sizeAttribute: new FormControl(),
      labelAttribute: new FormControl(),
      opacity: new FormControl(100)
    });
  }

  ngOnInit() {
    // Save form changes to map as user changes controls


    this._subs.push(this.form.get('colorRadio').valueChanges.subscribe(val => {
      debug('color radio selected', val);
    }));

    this._subs.push(this.form.get('fixedColor').valueChanges.subscribe(val => {
      debug('fixed color selected', val);
    }));

    this._subs.push(this.form.get('colorAttribute').valueChanges.subscribe(val => {
      debug('color attribute selected', val);
    }));

    this._subs.push(this.form.get('palette').valueChanges.subscribe(val => {
      debug('palette selected', val);
    }));

    this._subs.push(this.form.get('size').valueChanges.subscribe(val => {
      debug('size changed', val);
    }));

    this._subs.push(this.form.get('sizeRadio').valueChanges.subscribe(val => {
      debug('size radio selected', val);
    }));

    this._subs.push(this.form.get('sizeAttribute').valueChanges.subscribe(val => {
      debug('size attribute selected', val);
    }));

    this._subs.push(this.form.get('labelAttribute').valueChanges.subscribe(val => {
      debug('label attribute selected', val);
    }));

    this._subs.push(this.form.get('opacity').valueChanges.subscribe(val => {
      debug('opacity changed', val);
      this.map.setDataLayerOpacity(this.layerId, val / 100);
    }));

  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  ngOnChanges(changes) {
    // Transfer values to form
    if (changes.map && changes.map.currentValue) {
      const val: TomboloMapboxMap = changes.map.currentValue;
      // this.form.setValue({
      //
      // });
    }
  }

}
