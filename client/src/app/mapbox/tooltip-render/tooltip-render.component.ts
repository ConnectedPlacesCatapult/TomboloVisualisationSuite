/**
 * Tooltip Render Component
 */

import {Component, Input} from "@angular/core";
import {DataSource} from "@angular/cdk/collections";
import {Observable} from "rxjs/Observable";

export interface AttributeRow {
  name: string,
  description: string,
  id: string,
  value: number | string,
  unit: string
}

@Component({
  selector: 'tooltip-render',
  templateUrl: './tooltip-render.html',
  styleUrls: ['./tooltip-render.scss']
})
export class TooltipRenderComponent {
  private _data: object;

  attributesSource: AttributesDataSource;
  headerRows = ['name', 'value'];

  @Input() get data() {
    return this._data;
  }
  set data(data) {
    this._data = data;
    const dataArray = Object.keys(this._data).map(dataKey => this._data[dataKey]);
    this.attributesSource = new AttributesDataSource(dataArray);
  }

  formatValue(attribute: object): string | number {

    console.log(attribute);
    const value = attribute['value'];
    const unit = attribute['unit'];
    if (value === null || typeof value === 'undefined') return '<i>No Data</i>';
    if (typeof value === 'string') return value;

    let formattedValue = value.toPrecision(4);
    if (unit) {
      formattedValue = formattedValue + ' ' + unit;
    }

    return formattedValue;
  }
}

export class AttributesDataSource extends DataSource<any> {

  data: AttributeRow[];

  constructor(data) {
    super();
    this.data = data;
  }
  connect(): Observable<AttributeRow[]> {
    return Observable.of(this.data);
  }

  disconnect() {}
}
