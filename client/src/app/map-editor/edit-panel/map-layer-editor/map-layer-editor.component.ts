import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapLayerEditorComponent implements OnInit, OnChanges {

  @Input() map: TomboloMapboxMap;
  @Input() layerId: string;

  form: FormGroup;


  palettes: IPalette[] = [
    {
      id: 'DivGnYlRd',
      description: 'Diverging green-yellow-red',
      colorStops: ['#1a9641', '#a6d96a', '#ffffbf', '#fdae61', '#d7191c']
    },
    {
      id: 'SeqYlOrRd',
      description: 'Sequential yellow-orange-red',
      colorStops: ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026']
    }
  ];

  _subs: Subscription[] = [];

  constructor() {
    this.form = new FormGroup({
      label: new FormControl(),
      opacity: new FormControl(100),
      palette: new FormControl(this.palettes[0]),
      clonk: new FormControl()
    });
  }

  ngOnInit() {
    // Save form changes to map as user changes controls
    this._subs.push(this.form.get('opacity').valueChanges.subscribe(val => {
      this.map.setDataLayerOpacity(this.layerId, val / 100);
    }));

    this._subs.push(this.form.get('palette').valueChanges.subscribe(val => {
      debug('palette selected', val);
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
