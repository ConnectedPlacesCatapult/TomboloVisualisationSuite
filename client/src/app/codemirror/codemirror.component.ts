/**
 * Copyright © 2017 Emu Analytics
 */

import {AfterViewInit, Component, EventEmitter, forwardRef, Input, OnDestroy, Output, ViewChild} from "@angular/core";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

import * as CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/sql/sql'
import 'codemirror/addon/lint/lint.js';
import 'codemirror/addon/lint/json-lint.js';

/**
 * CodeMirror component
 */
@Component({
  selector: 'codemirror',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CodeMirrorComponent),
      multi: true
    }
  ],
  template: `<textarea #host readonly></textarea>`
})
export class CodeMirrorComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {

  @Input() config;
  @Output() change = new EventEmitter();
  @Output() focus = new EventEmitter();
  @Output() blur = new EventEmitter();
  @Output() cursorActivity = new EventEmitter();

  @ViewChild('host') private host;

  private instance = null;
  private _value = '';

  constructor() {}

  get value() { return this._value; }

  @Input() set value(v) {
    if (v !== this._value) {
      this._value = v;
      this.onChange(v);
    }
  }

  /**
   * On component destroy
   */
  ngOnDestroy() {

  }

  /**
   * On component view init
   */
  ngAfterViewInit() {
    this.config = this.config || {};
    this.initCodeMirror(this.config);
    this.enableLinting();

    // Redraw to calculate size correctly
    setTimeout(() => this.instance.refresh(), 0);
  }

  /**
   * Initialize codemirror
   */
  private initCodeMirror(config) {
    this.instance = CodeMirror.fromTextArea(this.host.nativeElement, config);
    this.instance.setValue(this._value);

    this.instance.on('change', () => {
      this.enableLinting();
      this.updateValue(this.instance.getValue());
    });

    this.instance.on('focus', (instance, event) => {
      this.focus.emit({instance, event});
    });

    this.instance.on('cursorActivity', (instance) => {
      this.cursorActivity.emit({instance});
    });

    this.instance.on('blur', (instance, event) => {
      this.blur.emit({instance, event});
    });
  }

  private enableLinting() {
    // Enable linting if value is not empty
    this.instance.setOption('lint', this.instance.getValue().trim());
  }

  /**
   * Value update process
   */
  updateValue(value) {
    this.value = value;
    this.onTouched();
    this.change.emit(value);
  }

  /**
   * Implements ControlValueAccessor
   */
  writeValue(value) {
    this._value = value || '';
    if (this.instance) {
      this.instance.setValue(this._value);
    }
  }
  onChange(_) {}
  onTouched() {}
  registerOnChange(fn) { this.onChange = fn; }
  registerOnTouched(fn) { this.onTouched = fn; }
}
