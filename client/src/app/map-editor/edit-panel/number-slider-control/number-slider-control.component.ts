import {ChangeDetectionStrategy, Component, forwardRef, HostBinding, Input, ViewEncapsulation} from '@angular/core';
import * as Debug from 'debug';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

const debug = Debug('tombolo:map-metadata-editor');

@Component({
  selector: 'number-slider-control',
  templateUrl: './number-slider-control.html',
  styleUrls: ['./number-slider-control.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumberSliderControlComponent), multi: true }
  ]
})
export class NumberSliderControlComponent implements ControlValueAccessor {

  @HostBinding('class.number-slider-component') numberSliderComponentClass = true;

  @Input() label: string;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() unit: string;
  @Input() value: number = 0;

  propagateChange = (_: any) => {};

  constructor() {}

  writeValue(value: any) {
    if (value !== undefined) {
      this.value = value;
    }
  }

  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  registerOnTouched() {}
}
