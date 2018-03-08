import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import * as Debug from 'debug';
import {TomboloMapboxMap} from '../../mapbox/tombolo-mapbox-map';
import {FormControl, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs/Subscription';
import {ITomboloDatasetAttribute} from '../../../../../src/shared/ITomboloDatasetAttribute';
import {IMapFilter} from '../../../../../src/shared/IMapFilter';

const debug = Debug('tombolo:filter-editor');

@Component({
  selector: 'filter-editor',
  templateUrl: './filter-editor.html',
  styleUrls: ['./filter-editor.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FilterEditorComponent implements OnInit, OnChanges {

  @HostBinding('class.filter-editor') layerEditorClass = true;

  @Input() map: TomboloMapboxMap;
  @Input() filter: IMapFilter;

  @Output() filterChange = new EventEmitter<IMapFilter>();

  form: FormGroup;
  mode: 'number' | 'string' = 'number';
  selectedAttribute: ITomboloDatasetAttribute;

  _subs: Subscription[] = [];

  constructor() {
    this.form = new FormGroup({
      dataLayerId: new FormControl(),
      dataAttribute: new FormControl(),
      operator: new FormControl(),
      value: new FormControl()
    });
  }

  ngOnInit() {
    // Save form changes to map as user changes controls

    this._subs.push(this.form.get('dataLayerId').valueChanges.subscribe(val => {
      this.emitFilterChanged();
    }));

    this._subs.push(this.form.get('dataAttribute').valueChanges.subscribe(val => {
      this.selectedAttribute = this.map.getDataAttributeForLayer(this.form.get('dataLayerId').value, val);
      this.mode = this.selectedAttribute.type as 'number' | 'string';
      this.emitFilterChanged();
    }));

    this._subs.push(this.form.get('operator').valueChanges.subscribe(val => {
      this.emitFilterChanged();
    }));

    this._subs.push(this.form.get('value').valueChanges.subscribe(val => {
      this.emitFilterChanged();
    }));
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  ngOnChanges(changes) {

    // Transfer values to form
    if ((changes.map || changes.filter) && this.map) {

      const filter = this.filter;

      this.form.setValue({
        dataLayerId: filter.datalayerId,
        dataAttribute: filter.attribute,
        operator: filter.operator,
        value: filter.value
      });
    }
  }

  attributesForSelectedLayer(): ITomboloDatasetAttribute[] {
    const seletedLayerId = this.form.get('dataLayerId').value;
    if (!seletedLayerId) return [];

    return this.map.getDataAttributesForLayer(seletedLayerId);
  }

  private emitFilterChanged() {

    const filter: IMapFilter = {
      ...this.filter,
      datalayerId: this.form.get('dataLayerId').value,
      attribute: this.form.get('dataAttribute').value,
      operator: this.form.get('operator').value,
      value: this.form.get('value').value
    }

    this.filterChange.emit(filter);
  }

}
